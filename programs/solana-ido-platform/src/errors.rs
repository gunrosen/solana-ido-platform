use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorMessage {
    #[msg("Unauthorized")]
    Unauthorized,
}