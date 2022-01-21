import React from 'react';
import './App.css';
import { useState, useEffect } from 'react'
import { BigNumber } from "ethers"



function App() {

  // Hide warnings from console
  console.warn = () => {};

  const [currentAccount, setCurrentAccount] = useState("")
  const [currentAccountUrl, setCurrentAccountUrl] = useState("")
  const [input, setInput] = useState("")
  // const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [amountSold, setAmountSold] = useState(0)
  const [totalSold, setTotalSold] = useState(0)
  const [fee, setFee] = useState(0)
  const [ethPrice, setEthPrice] = useState(0)
  const fees = []
  const hashes = []
  let feeTotal = 0;
  let amount = 0;


  
  //Make sure we have access to window.ethereum

  const checkIfWalletIsConnected = async () => {

    try {
      const { ethereum } = window

      if (!ethereum) {
        console.log("Make sure you have metamask!");
        return;
      } 

      if (currentAccount !== ''){
        return
      }
      // Check if there is a wallet in the url first 




      // Check if we're authorized to access the user's wallet

      const accounts = await ethereum.request({ method: "eth_accounts" })

      if (accounts.length !== 0) {
        const account = accounts[0]
        console.log("Found an authorized account: ", account)
        setCurrentAccount(account)

        if (window.location.pathname !== '/'){
          const url =  await window.location.pathname
          const input = await url.substring(1)
          console.log('Found an address from input', input)
          setCurrentAccountUrl(input) 
          return input  
          
        } else{
          return account
        }
        
      } else {
        if (window.location.pathname !== '/'){
          const url =  await window.location.pathname
          const input = await url.substring(1)
          console.log('Found an address from input', input)
          setCurrentAccountUrl(input) 
          return input  
          
        } else{
          console.log("No authorized account found. Connect your wallet.")
        }
        
      }
    } catch (error){
      console.log(error)
    }
  }


  // Allow user to connect wallet to the site

  const connectWallet = async () => {
    try {
      const { ethereum } = window

      if (!ethereum) {
        alert("Get MetaMask!")
        return;
      }

      const accounts = await ethereum.request({ method: "eth_requestAccounts" })

      console.log("Connected", accounts[0])
      setCurrentAccount(accounts[0])
      window.location.reload()

    } catch (error){
      console.log(error)
    }
  }

  const fetchData = async (address) => {
    try {
      const response = await fetch(`https://api.etherscan.io/api?module=account&action=txlistinternal&address=${address}&endblock=99999999&apikey=${process.env.REACT_APP_API_KEY}`)
      const data = await response.json()
      
      if (address === "") {
        console.log("Address not found. Cannot fetch data", address)
        return;
      }
      // setData(data)
      return data
    } catch (error){
      console.log(error)
    }
  }

  const fetchTransactions = async (index) => {
    try {
      const response = await fetch(`https://api.etherscan.io/api?module=proxy&action=eth_getTransactionByHash&txhash=${hashes[index]}&apikey=${process.env.REACT_APP_API_KEY}`)
      const data = await response.json()

      
      const int = BigNumber.from(data.result.value) // Convert uint256 to big int 
      const eth = Number(int) / 1000000000000000000 // Convert wei to eth 
      const openFee = eth * 0.025 // Multiply by opensea fee (2.5%)

      console.log(`Trasnaction ${hashes[index]} total: ${eth} cost you ${openFee} ETH in fees`)
      amount += eth
      setAmountSold(amount)
      fees.push(openFee)

    } catch (error){
      console.log(error)
    }
  }

  const fetchEthPrice = async () => {
    try {
      const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd')
      const data = await response.json()

      const price = data.ethereum.usd

      return price

    } catch(error){
      console.log(error)
    }
  }

  const setURL = async () => {
    try {
      const URL = window.location.pathname+input
      console.log(URL);
      window.location.replace(URL);

    } catch(error){
      console.log(error);
    }
  }


  // Runs out function when the page loads

  useEffect(() => {

    runMain()

    async function runMain(){
      try {
        const address = await checkIfWalletIsConnected()

        // If no wallet is found - do nothing
        while(address === undefined){
          return
        }

        const data = await fetchData(address)
          
        data.result.forEach( item  => {
          
          if (item.from === '0x7be8076f4ea4a4ad08075c2508e481d6c946d12b') {
            hashes.push(item.hash)
            console.log('OpenSea transaction added: ', item.hash)
          }  
        })
  
        for (let i = 0; i < hashes.length; i++) {
          await fetchTransactions(i)
        }
  
        for (let i = 0; i < fees.length; i++) {
          feeTotal += fees[i]
          console.log('Fee from opensea: ', fees[i])
          setFee(feeTotal)
          setTotalSold(i+1)
        }
        
        // Get current price of eth
        const price = await fetchEthPrice()
        setEthPrice(feeTotal*price)
  
        setLoading(false)
  
      } catch (error){
        console.log(error)
      }
    }
    
  
  }, [])
  
  return (
    <main>
          

      {!(/Mobi/.test(navigator.userAgent)) && (
        <button className="connectBtn" onClick={connectWallet}>{currentAccount === '' ? 'Connect Wallet' : currentAccount.substring(0, 8)+'...'}</button>    
      )}


      {(currentAccount === '' && currentAccountUrl === '') && (
        <div className="content">
          <h1>Connect your wallet to the site or submit it below.</h1>
          <div className="form">
            <input value={input} placeholder="0x00000..." onInput={e => setInput(e.target.value)}/>
            <button type="submit" onClick={() => setURL()}>➜</button>
          </div>
        </div>      
      )}


      {loading && (currentAccount !== '' || currentAccountUrl !== '') && (
          <div className="content">
          <h1>Doing some API magic 🎩🐇 Please hold... </h1>
          <p>The time this takes is based off of the amount of sales you've had and the amount of people using this right now.</p>
          </div>
      )}
   

      {!loading && (
        <div className="content">
          <h1>You have sold <span>{totalSold}</span> items on OpenSea for a total of <span>Ξ{amountSold.toFixed(3)}</span><br></br><br></br> OpenSea has taken <span>Ξ{fee.toFixed(3)}</span> from you in fees. Right now, that's worth <span>${ethPrice.toFixed(2)}</span> <br></br><br></br>
          {ethPrice === 0 && (
              'Lucky you'
          )}
          {ethPrice !== 0 && (
              // ethPrice > 1000 ? 'Yikes': 'Rip'
              'Rip'
          )}
          .</h1>
        </div>

      )}
      
      <footer>
      <p>Inspired by <a href="https://www.fees.wtf" target="_blank" rel="noreferrer" >fees.wtf</a></p>
      <p>Powered by <a href="https://etherscan.io/apis" target="_blank" rel="noreferrer" >Etherscan</a> and <a href="https://www.coingecko.com/en/api" target="_blank" rel="noreferrer" >CoinGecko</a> APIs</p>
      <p>Made with 🌐🎩 by <a href="https://www.twitter.com/0xPeak" target="_blank" rel="noreferrer" >@0xPeak</a></p>
      </footer>

    </main>
  );
}

export default App;

