use anchor_spl::{ token::{ Mint, Token, TokenAccount }, associated_token::AssociatedToken };
use anchor_lang::prelude::*;
use crate::{
    pool_account::PoolAccount,
    user_account::UserAccount,
    ErrorMessage,
    POOL_SEED,
    CONFIG_SEED,
    USER_ACCOUNT_SEED
};

#[derive(Accounts)]
#[instruction(amount: u64)]
pub struct BuyToken<'info> {
    #[account(mut)]
    pub buyer: Signer<'info>,

    #[account(
        init_if_needed,
        payer = buyer,
        space = TokenAccount::LEN,
        constraint = buyer_token_account.owner == buyer.key(),
        constraint = buyer_token_account.mint == mint.key()
    )]
    pub buyer_token_account: Account<'info, TokenAccount>,

    #[account(
        init_if_needed,
        payer = buyer,
        space = UserAccount::LEN,
        seeds = [USER_ACCOUNT_SEED, buyer.key().as_ref()],
        bump
    )]
    pub buyer_account: Account<'info, UserAccount>,
    #[account(mut)]
    pub mint: Account<'info, Mint>,
    
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,

}
pub fn process_buy_token( ctx: Context<BuyToken>, amount: u64) {
    
}