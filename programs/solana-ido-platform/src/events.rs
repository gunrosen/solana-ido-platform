use anchor_lang::prelude::*;

#[event]
pub struct BuyTokenEvent {
    pub buyer: Pubkey,
    pub token: Pubkey,
    pub amount: u64,
}