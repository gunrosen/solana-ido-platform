use anchor_lang::prelude::*;
pub mod constants;

pub use constants::*;
declare_id!("9ghHF9QjUqzR9RLMasz6niBTQyCD6TMpc85yy1g2ioo6");

#[program]
pub mod solana_ido_platform {
    use super::*;

    pub fn initialize(_ctx: Context<Initialize>) -> Result<()> {
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    /// CHECK:
    pub creator: UncheckedAccount<'info>,
}
