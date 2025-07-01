use crate::{
    pool_account::PoolAccount, user_account::UserAccount, ErrorMessage, CONFIG_SEED, POOL_SEED,
    USER_ACCOUNT_SEED,
};
use anchor_lang::prelude::*;
use anchor_lang::solana_program::sysvar::clock;
use anchor_spl::token_interface::{self, TokenInterface, TransferChecked};
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{self, Mint, Token, TokenAccount, Transfer},
};

#[derive(Accounts)]
#[instruction(amount: u64, bought_token_mint: Pubkey)]
pub struct BuyToken<'info> {
    #[account(mut)]
    pub buyer: Signer<'info>,

    #[account(
        mut,
        seeds = [POOL_SEED, bought_token_mint.key().as_ref()],
        bump
    )]
    pub pool_account: Account<'info, PoolAccount>,

    #[account(
        init_if_needed,
        payer = buyer,
        space = UserAccount::LEN,
        seeds = [USER_ACCOUNT_SEED, pool_account.token.key().as_ref(), buyer.key().as_ref()],
        bump
    )]
    pub buyer_account: Account<'info, UserAccount>,

    #[account(
        init_if_needed,
        payer = buyer,
        space = TokenAccount::LEN,
        constraint = buyer_token_account.owner == buyer.key(),
        constraint = buyer_token_account.mint == input_mint.key()
    )]
    pub buyer_token_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        associated_token::mint = pool_account.token,
        associated_token::authority = pool_account.receiver,
    )]
    pub receiver_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub input_mint: Account<'info, Mint>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}
pub fn process_buy_token(ctx: Context<BuyToken>, amount: u64) -> Result<(Pubkey, Pubkey, u64)> {
    // Logic check
    let current_time: u64 = clock::Clock::get()?.unix_timestamp.try_into().unwrap();
    let pool_account = &mut ctx.accounts.pool_account;
    let buyer_account = &mut ctx.accounts.buyer_account;
    let bought_token: u64 = amount
        .checked_mul(pool_account.token_rate_decimals as u64)
        .unwrap()
        .checked_div(pool_account.token_rate)
        .unwrap();
    require!(
        pool_account.start_time <= current_time,
        ErrorMessage::SaleNotStartedYet
    );
    require!(
        current_time <= pool_account.end_time,
        ErrorMessage::SaleEnded
    );
    require!(
        bought_token <= pool_account.token_for_sale,
        ErrorMessage::BuyMoreThanAllowed
    );
    require!(
        bought_token
            <= pool_account
                .token_for_sale
                .checked_sub(pool_account.token_sold)
                .unwrap(),
        ErrorMessage::NotEnoughTokenToBuy
    );

    // Perform
    let decimals = ctx.accounts.input_mint.decimals;
    let cpi_accounts = TransferChecked {
        mint: ctx.accounts.input_mint.to_account_info(),
        from: ctx.accounts.buyer_token_account.to_account_info(),
        to: ctx.accounts.receiver_token_account.to_account_info(),
        authority: ctx.accounts.buyer.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_context = CpiContext::new(cpi_program, cpi_accounts);
    token_interface::transfer_checked(cpi_context, amount, decimals)?;
    // Update state
    pool_account.token_sold = pool_account.token_sold.checked_add(bought_token).unwrap();
    buyer_account.bought = buyer_account.bought.checked_add(bought_token).unwrap();
    Ok((
        ctx.accounts.buyer.key(),
        ctx.accounts.pool_account.token,
        amount,
    ))
}
