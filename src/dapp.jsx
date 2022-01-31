import React, { useState, useEffect, useCallback, useMemo } from "react";
import ReactDOM from "react-dom";
import * as ethers from "ethers";
import { getChainByChainId } from "evm-chains";
import microtip from "microtip/microtip.css";
import { GlobalStyles, VStack, HStack, Wrapper, Divider, UnstyledButton, OutlinedButton, Card, Dot, Overlay } from "./styles";
import { X, ChevronRight, Upload, Eye, Edit2, Play } from "react-feather";

import TaskManager from './contracts/TaskManager.json';
import ContractAdresses from './addresses';

/*W
App = {
  web3Provider: null,
  contracts: {},

  init: async function () {
    return await App.initWeb3();
  },

  initWeb3: async function () {
    if (typeof web3 !== 'undefined') {
      App.web3Provider = web3.currentProvider;
      web3 = new Web3(web3.currentProvider);
      console.log("Web3 provided by metamask");
    } else {
      App.web3Provider = new Web3.providers.HttpProvider('http://localhost:8545');
      web3 = new Web3(App.web3Provider);
      console.log("Web3 provided by localhost");
    }
    return App.initContract();
  },

  initContract: async function () {
    var loader = $("#loader");
    var content = $("#content");

    loader.show();
    content.hide();

    await $.getJSON("TaskManager.json", function (marketplace) {
      App.contracts.TaskManager = TruffleContract(marketplace);
      App.contracts.TaskManager.setProvider(App.web3Provider);
    });

    await $.getJSON("Token.json", function (token) {
      App.contracts.Token = TruffleContract(token);
      App.contracts.Token.setProvider(App.web3Provider);
    });

    if (web3.currentProvider.enable) {
      web3.currentProvider.enable().then(function (acc) {
        App.account = acc[0];
        balance = 0;

        App.contracts.Token.deployed().then(function (tkn) {
          tkn.balanceOf(App.account).then(function (balance) {
            $("#accountAddress").html("Your Account: " + App.account + "<br> Balance: " + balance + " TKN");
          })
        })
      });
    } else {
      $("#accountAddress").html("Provider not enabled");
    }

    loader.hide();
    content.show();
  },
};

$(function () {
  $(window).load(function () {
    App.init();
  });
});
*/

async function connect() {
    window.ethereum.request({ method: "eth_requestAccounts" });
}

// Copies text to clipboard with a fake input
function copy(text) {
    var inp = document.createElement("input");
    inp.style.position = "absolute";
    inp.style.opacity = 0;
    document.body.appendChild(inp);
    inp.value = text;
    inp.select();
    document.execCommand("copy", false);
    inp.remove();
}

function Address({ address }) {
    return (
        <OutlinedButton
            style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                cursor: "pointer",
            }}
            onClick={() => copy(address)}
            aria-label="Copy wallet address"
            data-microtip-position="bottom"
            role="tooltip"
        >
            {" "}
            <span
                style={{
                    fontFamily: "var(--font-family-code)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    width: "60px",
                }}
            >
                {address}
            </span>
        </OutlinedButton>
    );
}

function useBalance(address, chainId) {
    const { ethereum } = window;
    const [balance, setBalance] = useState(null);

    useEffect(() => {
        let fetchedBalance = setBalance;
        function check() {
            const provider = new ethers.providers.Web3Provider(ethereum);
            provider.getBalance(address).then(fetchedBalance);
        }
        check();
        const interval = setInterval(check, 1000);
        return () => {
            clearInterval(interval);
            fetchedBalance = null;
        };
    }, [address, chainId]);

    return balance;
}

function Balance({ walletAddress, chainId }) {
    const balance = useBalance(walletAddress, chainId);

    if (balance === null) {
        return <span>Checking balance...</span>;
    }

    return (
        <span style={{ marginRight: "var(--space-8)", whiteSpace: "nowrap" }}>
            {ethers.utils.formatEther(balance).slice(0, 6)} ETH
        </span>
    );
}

const HelpIndicator = ({ text, pos, filled }) => {
    return (
        <div
            style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                minWidth: "20px",
                minHeight: "20px",
                backgroundColor: filled ? "var(--bg-higher)" : "transparent",
                border: "1px solid rgba(255,255,255,0.25)",
                fontFamily: "var(--font-family-default)",
                borderRadius: "100%",
                whiteSpace: "nowrap",
            }}
            aria-label={text}
            data-microtip-position={pos || "bottom"}
            role="tooltip"
            data-microtip-size="medium"
        >
            ?
        </div>
    );
};

function chainById(id) {
    try {
        return getChainByChainId(id);
    } catch (error) {
        return {
            name: `Chain ${id}`,
            faucets: [],
        };
    }
}

function ChainInfo({ chainId }) {
    const { name } = chainById(chainId);

    return (
        <VStack style={{ alignItems: "start" }}>
            <HStack style={{ alignItems: "center" }}>
                <Dot style={{ marginRight: "var(--space-8)" }} color="lightgreen" />
                <span
                    style={{
                        color:
                            chainId === 1
                                ? "var(--accent-warning-default)"
                                : "var(--fg-default)",
                    }}
                >
                    <span style={{ marginRight: "var(--space-8)" }}>{name}</span>

                    <HelpIndicator
                        text={
                            chainId === 1
                                ? "This is the primary network for Ethereum and uses real ETH for deployment"
                                : "You are connected to a test network. Test networks let you deploy your contracts with fake ETH"
                        }
                    />
                </span>
            </HStack>
        </VStack>
    );
}

function TaskCard({ data }) {
    return (
        <VStack
            style={{
                backgroundColor: "var(--bg-default)",
                border: "1px solid var(--outline-dimmest)",
                borderRadius: "var(--br-8)",
                marginBottom: "var(--space-16)",
                overflow: "hidden",
            }}
        >
            <HStack
                style={{
                    padding: "var(--space-8)",
                    borderBottom: "1px solid var(--outline-dimmest)"
                }}
            >
                {/* CONTRACT CONTENTS */}
                <h1>{data.description}</h1>

            </HStack>

        </VStack>
    );
}

let tempProvider = new ethers.providers.Web3Provider(window.ethereum);
let tempSigner = tempProvider.getSigner();
let tm = new ethers.Contract(ContractAdresses.TaskManager, TaskManager.abi, tempSigner);
let initialized = false;

export default function Dapp() {
    const walletAddress = useWalletAddress();
    const chainId = useChainId();

    const [taskDatas, setTaskDatas] = useState([]);
    useEffect(() => {
        if (!initialized) {
            (async () => {
                let resCount = await tm.getTasksCount();
                let datas = [];
                for (let i = 0; i < resCount.toNumber(); i++) {
                    let td = await tm.getTaskData(i);
                    datas.push(td);
                    console.log(td);
                }
                setTaskDatas(datas);
                // console.log('settaskdata');
            })();
            // console.log('init');
            initialized = true;
        }
        // console.log('effect');
    });
    // console.log('Dapp');

    const [showError, setShowError] = useState(false);
    const [errors, setErrors] = useState(null);
    React.useEffect(() => {
        setShowError(true);
    }, [errors]);

    if (typeof window.ethereum === "undefined") {
        return (
            <VStack
                style={{
                    alignItems: "center",
                    justifyContent: "center",
                    minHeight: "100vh",
                    gap: "var(--space-8)",
                    padding: 40,
                }}
            >
                <h1 style={{ textAlign: "center" }}>Dapp 🤝 Ethereum</h1>
                <a
                    style={{ whiteSpace: "nowrap" }}
                    href="https://metamask.io/"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    <button className="primary">Install Metamask 🦊</button>
                </a>
                <p style={{ color: "var(--fg-dimmest)", textAlign: "center" }}>
                    MetaMask is a Chrome Extension that lets you approve Ethereum
                    transactions
                </p>

                <p
                    style={{
                        color: "var(--fg-dimmest)",
                        textAlign: "center",
                    }}
                >
                    Once MetaMask is installed, this page should
                    <a href="/"> refresh </a>
                    automatically
                </p>

                <GlobalStyles />
                <ReloadOnRefocus />
            </VStack>
        );
    }

    return (
        <Wrapper>
            <GlobalStyles />

            {/* HEADER */}
            <HStack
                className="main-header"
                style={{
                    width: "100%",
                    justifyContent: "space-between",
                    paddingBottom: "var(--space-16)",
                }}
            >
                <VStack>
                    <h1
                        className="main-title"
                        style={{ paddingBottom: "var(--space-8)" }}
                    >
                        Dapp 🤝 Ethereum
                    </h1>
                    {walletAddress && <ChainInfo chainId={chainId} />}
                </VStack>

                {walletAddress ? (
                    <VStack style={{ alignItems: "end" }}>
                        <HStack
                            className="address-balance"
                            style={{ alignItems: "center", paddingBottom: "var(--space-8)" }}
                        >
                            <Balance
                                style={{ marginRight: "var(--space-16)" }}
                                chainId={chainId}
                                walletAddress={walletAddress}
                            />
                            <Address address={ethers.utils.getAddress(walletAddress)} />
                        </HStack>
                    </VStack>
                ) : (
                    <button className="primary" onClick={() => { connect(); console.log('uck ', walletAddress); }}>
                        Connect wallet
                    </button>
                )}
            </HStack>

            <Divider style={{ marginBottom: "var(--space-24)" }} />

            {/* DEPLOYMENT */}
            <HStack
                className="marketplace-header"
                style={{
                    width: "100%",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingBottom: "var(--space-16)",
                }}
            >
                <h2>Marketplace Tasks</h2>
                <p>{taskDatas.length + ' tasks'}</p>
            </HStack>

            <VStack
                className="marketplace-tasks"
                style={{
                    width: "100%",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingBottom: "var(--space-16)",
                }}
            >
                {taskDatas.map((taskData, k) => <TaskCard data={taskData.data} key={k} />)}
            </VStack>
        </Wrapper>);
}

function useWalletAddress() {
    const { ethereum } = window;
    let addr = ethereum && ethereum.selectedAddress;
    console.log('adresa ', addr);
    const [address, setAddress] = useState(addr);

    useEffect(() => {
        const onAddressChanged = (addresses) => setAddress(addresses[0]);
        ethereum && ethereum.on("accountsChanged", onAddressChanged);
        return () => {
            ethereum && ethereum.removeListener("accountsChanged", onAddressChanged);
        };
    });

    return address;
}

function useChainId() {
    const { ethereum } = window;
    const [chainId, setChainId] = useState((ethereum && ethereum.chainId) || "1");

    useEffect(() => {
        ethereum && ethereum.on("chainChanged", setChainId);
        return () => {
            ethereum && ethereum.removeListener("chainChanged", setChainId);
        };
    });

    return parseInt(chainId);
}

// To detect MetaMask was installed
function ReloadOnRefocus() {
    useEffect(() => {
        const onchange = (e) => {
            if (!document.hidden) {
                location.reload();
            }
        };
        document.addEventListener("visibilitychange", onchange);
        return () => document.removeEventListener("visibilitychange", onchange);
    }, []);
    return null;
}