// Sur Vercel, remplace le lien symbolique public -> public.nosync (contournement iCloud en local) par un vrai dossier.
import { existsSync, lstatSync, renameSync, unlinkSync } from "node:fs";

if (process.env.VERCEL && existsSync("public.nosync") && lstatSync("public").isSymbolicLink()) {
  unlinkSync("public");
  renameSync("public.nosync", "public");
  console.log("public.nosync -> public");
}
