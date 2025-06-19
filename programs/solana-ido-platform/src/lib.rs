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
}