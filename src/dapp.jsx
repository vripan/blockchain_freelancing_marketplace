import React, { useState, useEffect, useCallback, useMemo } from "react";
import * as ethers from "ethers";
import { getChainByChainId } from "evm-chains";
import microtip from "microtip/microtip.css";
import { X, ChevronRight, Upload, Eye, Edit2, Play } from "react-feather";
import { BrowserRouter, Routes, Route, Navigate, Outlet, useNavigate, Link } from "react-router-dom";

import { GlobalStyles, VStack, HStack, Wrapper, Divider, UnstyledButton, OutlinedButton, Card, Dot, Overlay } from './styles';

import Tasks from './components/tasks';
import Register from './register';
import Contracts from './contracts';

const MARKETPLACE_CHAIN_ID = 1337;

async function connect() {
    window.ethereum.request({ method: "eth_requestAccounts" });
}

function useWalletAddress() {
    const { ethereum } = window;
    let value = ethereum && ethereum.selectedAddress;
    const [address, setAddress] = useState(value);

    useEffect(() => {
        const onAddressChanged = (addresses) => setAddress(addresses[0]);
        ethereum && ethereum.on("accountsChanged", onAddressChanged);
        return () => {
            ethereum && ethereum.removeListener("accountsChanged", onAddressChanged);
        };
    });

    return address || value;
}

// Copies text to clipboard
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

function useChainId() {
    const { ethereum } = window;
    const [chainId, setChainId] = useState(ethereum && ethereum.chainId);

    useEffect(() => {
        ethereum && ethereum.on("chainChanged", setChainId);
        return () => {
            ethereum && ethereum.removeListener("chainChanged", setChainId);
        };
    });

    let id = chainId || (ethereum && ethereum.chainId) || "1";
    return parseInt(id);
}

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

let initialized = false;

export default function Dapp() {
    const walletAddress = useWalletAddress();
    const chainId = useChainId();
    const [hasRole, setHasRole] = useState(false);

    const { taskManager } = Contracts;

    const [taskDatas, setTaskDatas] = useState([]);
    useEffect(() => {
        if (chainId != MARKETPLACE_CHAIN_ID) {
            return;
        }

        if (!initialized) {
            (async () => {
                let resCount = await taskManager.getTasksCount();
                let datas = [];
                for (let i = 0; i < resCount.toNumber(); i++) {
                    let td = await taskManager.getTaskData(i);
                    td.taskId = i;
                    datas.push(td);
                    // console.log(td);
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

    if (chainId != "1" && chainId != MARKETPLACE_CHAIN_ID) {
        console.log(chainId);
        return (
            <Wrapper>
                <GlobalStyles />
                <h1>
                    Please change chain to the Dapp chain
                </h1>
            </Wrapper>
        );
    }

    return (
        <BrowserRouter>
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
                        <button className="primary" onClick={connect}>
                            Connect wallet
                        </button>
                    )}

                </HStack>

                {!hasRole ? (<Link to="/register">Get role</Link>) : null}

                <Divider style={{ marginBottom: "var(--space-24)" }} />

                <Routes>
                    <Route path='/' element={<Tasks taskDatas={taskDatas} />} />
                    <Route path="/register" element={!hasRole ? <Outlet /> : <Navigate to="/" />}>
                        <Route path='/register' element={<Register walletAddress={walletAddress} />} />
                    </Route>
                </Routes>

            </Wrapper>
        </BrowserRouter>
    );
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