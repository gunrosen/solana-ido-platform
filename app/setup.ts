import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import {SolanaIdoPlatform} from "../target/types/solana_ido_platform";
export async function setup(){
  const connection = new anchor.web3.Connection(
    process.env.RPC_ENDPOINT || "https://api.devnet.solana.com",  );
  const idl = require("../target/idl/solana_ido_platform.json");
  const path_authority_key = "../deploy/id.json";
  const authority = anchor.web3.Keypair.fromSecretKey(
    new Uint8Array(require(path_authority_key))
  );
  const wallet = new anchor.Wallet(authority);
  const provider = new anchor.AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });
  const program = new Program(idl, provider) as Program<SolanaIdoPlatform>;
  return {
    program,
    authority,
    connection,
    provider,
  };
}