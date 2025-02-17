const readline = require("readline");
const {
  encrypt,
  decrypt,
  savePasswords,
  loadPasswords,
  verifyPasscode,
} = require("./utils");

let passwords = loadPasswords();
let inactivityTimer;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function resetInactivityTimer() {
  clearTimeout(inactivityTimer);
  inactivityTimer = setTimeout(() => {
    console.log(
      "\nSession timed out due to inactivity. Please re-authenticate."
    );
    authenticateUser().then(() => menu());
  }, 30000);
}

function authenticateUser() {
  return new Promise((resolve) => {
    rl.question("Enter passcode: ", { hideEchoBack: true }, (input) => {
      if (verifyPasscode(input)) {
        console.log("Authentication successful.");
        resetInactivityTimer();
        resolve(true);
      } else {
        console.log("Invalid passcode. Please try again.");
        resolve(false);
      }
    });
  });
}

function generateRandomString(length) {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

const randomString = generateRandomString(10); 
function exitApplication() {
  clearTimeout(inactivityTimer);
  console.log("👋 Exiting...! Have a nice day");
  rl.close(); 
  process.exit();
}

const menu = async () => {
  resetInactivityTimer(); 
  console.log("\n🔐 Password Manager CLI");
  console.log("1. Save a new password");
  console.log("2. View saved passwords");
  console.log("3. Delete password");
  console.log("4. Exit");
  rl.question("Choose an option: ", async (choice) => {
    if (choice === "1" || choice === "2") {
      const authenticated = await authenticateUser();
      if (!authenticated) {
        console.log("❌ Incorrect passcode. Access denied.");
        menu();
        return;
      }
    }

    if (choice === "1") {
      rl.question("Enter website name: ", (website) => {
        rl.question("Enter username: ", (username) => {
          const randomString = generateRandomString(10);
          const c = randomString;
          console.log("Suggested password is", c);
          rl.question("Do you wish to continue- y/n?", (resp) => {
            if (resp === "n" || resp === "N") {
              rl.question(
                "Enter password: ",
                { hideEchoBack: true },
                (password) => {
                  if (!Array.isArray(passwords)) {
                    passwords = [];
                  }
                  passwords.push({
                    website,
                    username,
                    password: encrypt(password),
                  });
                  savePasswords(passwords);
                  console.log("✅ Password saved successfully!");
                  resetInactivityTimer();
                  menu();
                }
              );
            }
            if (resp === "Y" || resp === "y") {
              passwords.push({
                website,
                username,
                password: encrypt(c),
              });
              savePasswords(passwords);
              console.log("✅ Password saved successfully!");
              resetInactivityTimer(); 
              menu();
            }
          });
        });
      });
    }
    else if (choice === "2") {
      console.log("\n🔑 Saved Passwords:");
      const uniqueWebsites = [
        ...new Set(passwords.map((entry) => entry.website)),
      ];
      uniqueWebsites.forEach((website, index) => {
        console.log(`${index + 1}. ${website}`);
      });

     
      rl.question(
        "\nEnter a website name to view usernames or type 'n' to return to the main menu: ",
        (websiteInput) => {
          if (websiteInput.toLowerCase() === "n") {
            resetInactivityTimer();
            menu(); 
          } else {
            const websiteEntries = passwords.filter(
              (entry) =>
                entry.website.toLowerCase() === websiteInput.toLowerCase()
            );

            if (websiteEntries.length === 0) {
              console.log("❌ No entries found for this website.");
              resetInactivityTimer();
              menu();
            } else {
              console.log(`\n👤 Usernames for ${websiteInput}:`);
              websiteEntries.forEach((entry, index) => {
                console.log(`${index + 1}. ${entry.username}`);
              });
              rl.question(
                "\nEnter a username to reveal the password.Type 'n' to return to the main menu: ",
                (usernameInput) => {
                  if (usernameInput.toLowerCase() === "n") {
                    resetInactivityTimer();
                    menu(); 
                  } else {
                    const userEntry = websiteEntries.find(
                      (entry) =>
                        entry.username.toLowerCase() ===
                        usernameInput.toLowerCase()
                    );

                    if (userEntry) {
                      console.log(
                        `\n🔓 Password for ${userEntry.username} on ${
                          userEntry.website
                        }: ${decrypt(userEntry.password)}`
                      );
                    } else {
                      console.log("❌ Username not found.");
                    }

                    resetInactivityTimer();
                    menu();
                  }
                }
              );
            }
          }
        }
      );
    } else if (choice === "3") {
      const authenticated = await authenticateUser();
      if (!authenticated) {
        console.log("❌ Incorrect passcode. Access denied.");
        menu();
        return;
      }
      console.log("\n🔑 Saved Passwords:");
      passwords.forEach((entry, index) => {
        console.log(`${index + 1}. ${entry.website} - ${entry.username}`);
      });

      rl.question(
        "Enter the number of the password you want to delete: ",
        (indexStr) => {
          const index = parseInt(indexStr) - 1;

          if (isNaN(index) || index < 0 || index >= passwords.length) {
            console.log("❌ Invalid selection. Please try again.");
            resetInactivityTimer();
            menu();
            return;
          }
          rl.question(
            `Are you sure you want to delete the password for ${passwords[index].website}? (y/n): `,
            (confirm) => {
              if (confirm.toLowerCase() === "y") {
                const removed = passwords.splice(index, 1);
                savePasswords(passwords);

                console.log(
                  `✅ Password for ${removed[0].website} has been deleted.`
                );
              } else {
                console.log("Deletion cancelled.");
              }

              resetInactivityTimer();
              menu();
            }
          );
        }
      );
    } else if (choice === "4") {
      exitApplication();
    } else {
      console.log("❌ Invalid choice. Try again.");
      resetInactivityTimer(); 
      menu();
    }
  });
};

menu();
