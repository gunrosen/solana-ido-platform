import { setup } from "./setup";
import * as anchor from "@coral-xyz/anchor";
import moment from "moment/moment";

(async () => {
  const { program, authority  } = await setup();
  const inputMint = new anchor.web3.PublicKey("Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB");
  const tokenMint = new anchor.web3.PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");
  const receiver = anchor.web3.Keypair.generate();

  const startTime = Math.floor(moment().add(10, "seconds").valueOf() / 1000);
  const endTime = Math.floor(moment().add(50, "hours").valueOf() / 1000);
  const claimTime = Math.floor(moment().add(51, "hours").valueOf() / 1000);
  const tokenForSale = 1_000_000;
  const tokenSold = 0
  const tokenRate = 1;
  const tokenRateDecimals = 2;
  const signature = await program.methods
    .createPool(
      new anchor.BN(startTime),
      new anchor.BN(endTime),
      new anchor.BN(claimTime),
      new anchor.BN(tokenForSale),
      new anchor.BN(tokenSold),
      new anchor.BN(tokenRate),
      tokenRateDecimals,
      inputMint,
      tokenMint,
      authority.publicKey,
      receiver.publicKey,
    )
    .accounts({signer: authority.publicKey})
    .signers([authority])
    .rpc();
  console.log(`Create pool signature ${signature}`);
})();