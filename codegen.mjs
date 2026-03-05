import { createFromRoot } from 'codama';
import { rootNodeFromAnchor } from '@codama/nodes-from-anchor';
import { renderVisitor } from '@codama/renderers-js';
import { readFileSync, writeFileSync, rmSync, readdirSync } from 'fs';
import path from 'path';

const PROGRAMS = [
  {
    idl: 'src/idl/scope.json',
    output: 'src/@codegen/scope',
    programAddress: 'HFn8GnPADiny6XqUoWE8uRPPxb29ikn4yTuPa9MF2fWJ',
  },
  {
    idl: 'src/idl/kliquidity.json',
    output: 'src/@codegen/kliquidity',
    programAddress: '6LtLpnUFNByNXLyCoK9wA2MykKAmQNZKBdY8s47dehDc',
  },
  {
    idl: 'src/idl/jupiter-perps.json',
    output: 'src/@codegen/jupiter-perps',
    programAddress: 'PERPHjGBqRHArX4DySjwM6UJHiR3sWAatqfdBS2qQJu',
  },
];

// Clean output
rmSync('src/@codegen', { recursive: true, force: true });

for (const prog of PROGRAMS) {
  console.log(`Generating ${prog.output} from ${prog.idl}...`);
  const idl = JSON.parse(readFileSync(prog.idl, 'utf-8'));
  const codama = createFromRoot(rootNodeFromAnchor(idl));
  await codama.accept(renderVisitor(prog.output));

  // Fix empty program address that codama generates from Anchor IDL v0.
  // Anchor IDL v0 doesn't include the program address in metadata, so codama
  // generates an empty string. We patch all .ts files in the programs/ dir.
  const programsDir = path.join(prog.output, 'programs');
  let programsFiles;
  try {
    programsFiles = readdirSync(programsDir);
  } catch {
    programsFiles = [];
  }

  const emptyAddr = '"" as Address<"">';
  const patchedAddr = `"${prog.programAddress}" as Address<"${prog.programAddress}">`;

  for (const file of programsFiles) {
    const filePath = path.join(programsDir, file);
    const content = readFileSync(filePath, 'utf-8');
    if (content.includes(emptyAddr)) {
      writeFileSync(filePath, content.replaceAll(emptyAddr, patchedAddr));
      console.log(`  Patched program address in ${filePath}`);
    }
  }
}

console.log('Done!');
