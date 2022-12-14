import React, { useEffect, useState } from 'react';
import Multisig from './contracts/Multisig.json';
import { getWeb3 } from './utils.js';

function App() {
  const [web3, setWeb3] = useState(undefined);
  const [accounts, setAccounts] = useState(undefined);
  const [contract, setContract] = useState(undefined);
  const [balance, setBalance] = useState(undefined);
  const [currentTransfer, setCurrentTransfer] = useState(undefined);
  const [quorum, setQuorum] = useState(undefined);

  useEffect(() => {
    const init = async () => {
      const web3 = await getWeb3();
      const accounts = await web3.eth.getAccounts();
      const networkId = await web3.eth.net.getId();
      const deployedNetwork = Multisig.networks[networkId];
      const contract = new web3.eth.Contract(
        Multisig.abi,
        deployedNetwork && deployedNetwork.address,
      );

      //6 
      const quorum = await contract.methods
        .quorum()
        .call();

      setWeb3(web3);
      setAccounts(accounts);
      setContract(contract);
      setQuorum(quorum);
    }
    init();
    window.ethereum.on('accountsChanged', accounts => {
      setAccounts(accounts);
    });
  }, []);

  //2 to trigger the updateBalance function 
  //set an array of variables, hook is triggered when variable is changed 
  useEffect(() => {
    if(typeof contract !== 'undefined' && typeof web3 !== 'undefined') {
      updateBalance();
      updateCurrentTransfer();
    }
  }, [accounts, contract, web3]);

  //1
  async function updateBalance() {
    const balance = await web3.eth.getBalance(contract.options.address);
    setBalance(balance);
  }
// 3 at begining no transfer we will see only create transfer 
//after the transfer is created , then first form is hidden and form 2 i.e vote form will display
//new state currentTransfer will be displayed  
  async function createTransfer(e) {
    e.preventDefault();
    const amount = e.target.elements[0].value;
    const to = e.target.elements[1].value;
    await contract.methods
      .createTransfer(amount, to)
      .send({from: accounts[0]});
    await updateCurrentTransfer();
  };

  // 7 function to approve the transfer 
  async function sendTransfer() {
    await contract.methods
      .sendTransfer(currentTransfer.id)
      .send({from: accounts[0]});

      //to refresh the UI 
    await updateBalance();
    await updateCurrentTransfer();
  };

  //4 add hook prior 4 to remain update about the current transfer 
  async function updateCurrentTransfer() {
    const currentTransferId = (await contract.methods
      .nextId()
      .call()) - 1;
    if(currentTransferId >= 0) {
      const currentTransfer = await contract.methods
        .transfers(currentTransferId)
        .call();
        //to fetch current state of approval 
      const alreadyApproved = await contract.methods
        .approvals(accounts[0], currentTransferId)
        .call();
        //add already approved flag to current tranfer use destructuring syntax 
      setCurrentTransfer({...currentTransfer, alreadyApproved});
    }
  }

  if (!web3) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container">
      <h1 className="text-center">Multisig</h1>

      <div className="row">
        <div className="col-sm-12">
           <p>Balance: <b>{balance}</b> wei </p>
        </div>
      </div>

  {/*5 add quorum hook prior 5 to*/} 
      {!currentTransfer || currentTransfer.approvals === quorum ? ( 
        <div className="row">
          <div className="col-sm-12">
            <h2>Create transfer</h2>
            <form onSubmit={e => createTransfer(e)}>
              <div className="form-group">
                <label htmlFor="amount">Amount</label>
                <input type="number" className="form-control" id="amount" />
              </div>
              <div className="form-group">
                <label htmlFor="to">To</label>
                <input type="text" className="form-control" id="to" />
              </div>
              <button type="submit" className="btn btn-primary">Submit</button>
            </form>
          </div>
        </div>
      ) : (
        <div className="row">
          <div className="col-sm-12">
            <h2>Approve transfer</h2>
            <ul>
            {/*8 display info for current transfer*/} 
              <li>TransferId: {currentTransfer.id}</li>
              <li>Amount: {currentTransfer.amount}</li>
              <li>Approvals: {currentTransfer.approvals}</li>
            </ul>
             {/*9 conditionaly display the submit button only if we haven't voted yet*/} 
            {currentTransfer.alreadyApproved ? 'Already approved' : (
              <button 
                type="submit" 
                className="btn btn-primary"
                onClick={sendTransfer}
              >Submit</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
