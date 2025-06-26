use anchor_lang::prelude::*;
use crate::{
    config_account::ConfigAccount,
    pool_account::PoolAccount,
    ErrorMessage,
    POOL_SEED,
    CONFIG_SEED
};

#[derive(Accounts)]
#[instruction(currency_amount: u64)]
pub struct BuyToken<'info> {
    #[account(mut, constraint = buyer.lamports() >= currency_amount @ ErrorMessage::InsufficientBalance)]
    pub buyer: Signer<'info>,
}
pub fn process_buy_token_with_sol( ctx: Context<BuyToken>,) {
    
}