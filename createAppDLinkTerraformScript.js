const fs = require("fs");
const path = require('path');
const { exec } = require('child_process');
const { parse } = require("csv-parse");

const args = process.argv.slice(2);
const TF_FILE_PATH = 'appDDataLink.tf';

const generateTerraformFile = () => {

  if (args.length < 3) {
    console.log(
      "Please specify the path for csv file, env url and the auth token", args
    );
    console.log(
      "Usage: node createAppDLinkTerraformScript.js <path_to_csv_file> <env_url> <auth_token>"
    );
    return false;
  } else {
    const writableStream = fs.createWriteStream(TF_FILE_PATH);

    const appDLinkProvider = [];
    const appDLinkResource = [];

    try {
      //reading data from provider stub file
      fs.createReadStream("./data/appDLinkProviderStub.txt", {
        encoding: "utf8",
      })
        .on("data", function (row) {
          appDLinkProvider.push(row);
        })
        .on("close", () => {
          // write the provider to terraform file
          writableStream.write(appDLinkProvider.toString());

          //reading data from resource stub file
          fs.createReadStream("./data/appDLinkResourceStub.txt", {
            encoding: "utf8",
          })
            .on("data", function (row) {
              appDLinkResource.push(row);
            })
            .on("close", () => {
              // reading data from link csv file
              try {
                fs.createReadStream(args[0], {
                  encoding: "utf8",
                })
                .pipe(parse({ delimiter: ",", from_line: 2 }))
                  .on("data", function (row) {
                    let elResStr = appDLinkResource.toString();
                    elResStr = elResStr.replace(
                      "{{resource_label}}",
                      `${row[0]}_${row[1]}`
                    );
                    elResStr = elResStr.replace("{{olly_service}}", row[0]);
                    elResStr = elResStr.replace("{{appd_link_label}}", row[1]);
                    elResStr = elResStr.replace("{{appd_link}}", row[2]);
                    writableStream.write(elResStr);
                  })
                  .on("close", () => {
                    // close the write stream
                    writableStream.end();
                    console.log(
                      `Terrafrom script file generated at ${TF_FILE_PATH}`);
                  });
              } catch (err) {
                console.log('Error reading the csv file. Make sure that it follows the correct pattern as specified in README.md file', err);
                return false;
              }
            });
        });
        return true;
    } catch (err) {
      console.log(err);
      return false;
    }
  }
};

const checkTerraformFileExists = () => {
  const filePath = path.resolve(TF_FILE_PATH);
  if (fs.existsSync(filePath)) {
    console.log('Terraform file exists.');
    return true;
  } else {
    console.error('Terraform file does not exist.');
    return false;
  }
}

const executeCommand = (command, env) => {
  return new Promise((resolve, reject) => {
    exec(command, { env }, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing command: ${error.message}`);
        reject(error);
        return;
      }
      if (stderr) {
        console.error(`Error output: ${stderr}`);
        reject(new Error(stderr));
        return;
      }
      console.log(`Command output: ${stdout}`);
      resolve(stdout);
    });
  });
}

const runTFCommands = async() => {
  const tfLogPath = "APPD_LINK_TF_LOGS.log";
  const tfLogLevel = "DEBUG"

  try {
    let envLogsEnabled = { ...process.env, "TF_LOG": tfLogLevel, "TF_LOG_PATH": tfLogPath }

    console.log('\n\n.....running terraform command: terraform init.....');
    await executeCommand(`terraform init`, envLogsEnabled);

    console.log('\n\n.....running terraform command: terraform plan.....');
    const apiUrl = `-var="signalfx_api_url=${args[1]}"`;
    const token = `-var="signalfx_auth_token=${args[2]}"`;
    await executeCommand(`terraform plan ${apiUrl} ${token} -out=appDLink_Plan`, envLogsEnabled);

    console.log('\n\n.....running terraform command: terraform apply.....');
    await executeCommand(`terraform apply "appDLink_Plan"`, envLogsEnabled);
  } catch (error) {
    console.error(`Error while running Terraform commands. Please refer logs for more information`);
  }
};

const runScript = async () => {
  console.log('.....running createAppDLinkTerraformScript.....');
  const isTFFileGenerated = await generateTerraformFile();

  const checkInterval = setInterval(() => {
    if (isTFFileGenerated === false) {
      clearInterval(checkInterval);
    }
    if (checkTerraformFileExists() && isTFFileGenerated) {
      runTFCommands();
      clearInterval(checkInterval);
    }
  }, 1000);
};

runScript();

