use anchor_lang::prelude::*;
pub mod instructions;
pub mod states;
pub mod constants;
pub mod errors;

pub use instructions::{ initialize::* , create_pool::*};
pub use states::*;
pub use constants::*;
pub use errors::*;

declare_id!("9ghHF9QjUqzR9RLMasz6niBTQyCD6TMpc85yy1g2ioo6");

#[program]
pub mod solana_ido_platform {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, owner: Pubkey, creator: Pubkey) -> Result<()> {
         process_initialize(ctx, owner, creator)
    }

    pub fn create_pool(
        ctx: Context<CreatePool>,
        start_time: u64,
        end_time: u64,
        claim_time: u64,
        tokens_for_sale: u64,
        token_sold: u64,
        token_rate: u64,
        token_rate_decimals: u8,
        currency: Pubkey,
        token: Pubkey,
        signer: Pubkey
    ) -> Result<()> {
        process_create_pool(
            ctx,
            start_time,
            end_time,
            claim_time,
            tokens_for_sale,
            token_sold,
            token_rate,
            token_rate_decimals,
            currency,
            token,
            signer
        )
    }
}