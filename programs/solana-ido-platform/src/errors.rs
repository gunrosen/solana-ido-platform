use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorMessage {
    #[msg("Unauthorized")]
    Unauthorized,

    #[msg("InvalidPoolTime")]
    InvalidPoolTime,
    
    #[msg("InsufficientBalance")]
    InsufficientBalance,
    
    #[msg("SaleNotStartedYet")]
    SaleNotStartedYet,

    #[msg("SaleEnded")]
    SaleEnded,

    #[msg("BuyMoreThanAllowed")]
    BuyMoreThanAllowed,

    #[msg("NotEnoughTokenToBuy")]
    NotEnoughTokenToBuy,
}