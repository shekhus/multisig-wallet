//https://goerli.infura.io/v3/12d81d2652574509b991c7f01ffbd77f
const fs =require('fs');
const HDWalletProvider= require('@truffle/hdwallet-provider')

const secrets = JSON.parse(fs.readFileSync('.secrets').toString().trim());
//JSON.parse(fs.readFileSync('.secrets').toString().trim());
// truffle-hdwallet-provier
module.exports = {networks : {
            development: {
          host: "127.0.0.1",
          port: 8545,
          network_id: "*" // Match any network id
        },
        
    goerli:{
        provider:() =>
            new HDWalletProvider(
                secrets.seed,
                `https://goerli.infura.io/v3/${secrets.projectId}`
            ),
            network_id :5
            }  
          },
          compilers: {
            solc: {
              version: "^0.8.0"
            }
          }
        };
