import { Web3Storage, File } from "web3.storage";
import fs from "fs";
import path from "path";

export async function uploadToIPFS(token: string, mediaPaths: string[], metadata: Record<string, any>): Promise<string> {
  const client = new Web3Storage({ token });

  const files: File[] = [];
  for (const p of mediaPaths) {
    const data = await fs.promises.readFile(p);
    files.push(new File([data], path.basename(p)));
  }

  const metadataBlob = new Blob([JSON.stringify(metadata, null, 2)], { type: "application/json" });
  files.push(new File([metadataBlob], "metadata.json"));

  const cid = await client.put(files, { wrapWithDirectory: true });
  return cid;
}
