const { execSync } = require("child_process");

// 1. Grab the migration name from the command line arguments
const arg = process.argv[2];

if (!arg) {
  console.error("Error: You must provide a migration name.");
  console.error("Example: npm run migration:generate CreateUserTable");
  process.exit(1);
}

// 2. Define the path where you want migrations to go
const migrationPath = `./database/migrations/${arg}`;

// 3. Construct the full TypeORM command
// Note: We use 'npx' here to ensure we use the local version of typeorm
const command = `npx typeorm-ts-node-commonjs migration:generate ${migrationPath} -d ./database/data-source.ts`;

console.log(`Running: ${command}`);

// 4. Execute the command
try {
  execSync(command, { stdio: "inherit" });
} catch (error) {
  // Errors are printed automatically by stdio: 'inherit'
  process.exit(1);
}
