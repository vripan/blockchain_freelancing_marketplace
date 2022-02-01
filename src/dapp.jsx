import React, { useState, useEffect, useCallback, useMemo } from "react";
import * as ethers from "ethers";
import { getChainByChainId } from "evm-chains";
import microtip from "microtip/microtip.css";
import { X, ChevronRight, Upload, Eye, Edit2, Play } from "react-feather";
import { BrowserRouter, Routes, Route, Navigate, Outlet, Link } from "react-router-dom";

import { GlobalStyles, VStack, HStack, Wrapper, Divider, UnstyledButton, OutlinedButton, Card, Dot, Overlay } from './styles';

import Tasks from './components/tasks';
import Register from './register';
import Contracts from './contracts';
import Task from './task';
import CreateTask from './createTask';

const MARKETPLACE_CHAIN_ID = 1337;

async function connect() {
    window.ethereum.request({ method: "eth_requestAccounts" });
}

function useWalletAddress(setRole) {
    const { ethereum } = window;
    let value = ethereum && ethereum.selectedAddress;
    const [address, setAddress] = useState(value);

    useEffect(() => {
        const onAddressChanged = (addresses) => {
            setAddress(addresses[0]);
            setRole(null);

            location.reload();
        };
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

function useTokens(address, chainId) {
    const { tokenC } = Contracts;
    const [tokens, setTokens] = useState(null);

    useEffect(() => {
        let fetchedBalance = setTokens;
        function check() {
            tokenC.balanceOf(address).then(fetchedBalance);
        }
        check();
        const interval = setInterval(check, 3000);
        return () => {
            clearInterval(interval);
            fetchedBalance = null;
        };
    }, [address, chainId]);

    return tokens
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

function Balance({ walletAddress, chainId, tokenC }) {
    const balance = useBalance(walletAddress, chainId);
    const tokens = useTokens(walletAddress, chainId);

    if (balance === null) {
        return <span>Checking balance...</span>;
    }

    return (
        <span style={{ marginRight: "var(--space-8)", whiteSpace: "nowrap" }}>
            {tokens + ' '}
            <span
                style={{ cursor: "pointer", color: 'orange' }}
                onClick={() => copy(tokenC.address)}
                aria-label="Copy token address"
                data-microtip-position="bottom"
                role="tooltip"
            >
                TKN
            </span>
            {' ' + ethers.utils.formatEther(balance).slice(0, 6) + ' ETH'}
        </span>
    );
}

function RequestTKN({ address }) {
    const [requesting, setRequesting] = useState(false);
    const { tokenC } = Contracts;

    async function getTokens(e) {
        e.preventDefault();
        setRequesting(true);
        tokenC.mint().then(() => setRequesting(false));
        //await new Promise((resolve) => setTimeout(resolve, 20 * 1000));
    }

    if (requesting) {
        return (
            <span
                className={requesting && "animate-flicker"}
                style={{ color: "var(--fg-dimmest)", textAlign: "right" }}
            >
                Requesting TKN...
            </span>
        )
    }

    return (
        <a style={{ textAlign: "right" }} href="#" onClick={getTokens}>
            Get TKN for testing
        </a>
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

export default function Dapp() {
    const { taskManager, memberManager, tokenC } = Contracts;

    const [role, setRole] = useState(null);
    const [taskDatas, setTaskDatas] = useState(null);

    const walletAddress = useWalletAddress(setRole);
    // DEVELOPMENT!!! const chainId = useChainId();
    const chainId = MARKETPLACE_CHAIN_ID;

    useEffect(() => {
        if (chainId != MARKETPLACE_CHAIN_ID ||
            (typeof window.ethereum === "undefined")) {
            return;
        }

        if (!taskDatas) {
            (async () => {
                let resCount = (await taskManager.getTasksCount()).toNumber();
                let datas = [];
                for (let i = 0; i < resCount; i++) {
                    let td = await taskManager.getTaskData(i);
                    if (td.state == 0) {
                        resCount++;
                        continue;
                    }
                    td.taskId = i;
                    datas.push(td);
                    // console.log(td);
                }
                setTaskDatas(datas);
                // console.log('settaskdata');
            })();
        }

        if (walletAddress && role == null) {
            (async () => {
                let role = await memberManager.getRole(walletAddress);
                setRole(role);
            })();
        }
        // console.log('effect');
    });

    const [showError, setShowError] = useState(false);
    const [errors, setErrors] = useState(null);
    const [showInfos, setShowInfos] = useState(false);
    const [infos, setInfos] = useState(null);
    const [lastType, setLastType] = useState(null);

    useEffect(() => {
        setShowError(true);
    }, [errors]);
    useEffect(() => {
        setShowInfos(true);
    }, [infos]);

    function addMessage(msg, type = "Error") {
        if (type == "Error") {
            let errA = errors;
            if (!errA) {
                errA = [];
            }
            errA.push(msg);
            setErrors(errA);
        }
        else {
            let infA = infos;
            if (!infA) {
                infA = [];
            }
            infA.push(msg);
            setInfos(infA);
        }
        setLastType(type);
    }

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
                <h1 style={{ textAlign: "center" }}>Dapp 🤝 Marketplace</h1>
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

    if (chainId != MARKETPLACE_CHAIN_ID) {
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

                {/* MESSAGE DIALOG 
			    automatically opens on error but can be reopened with the error button
                */}
                <>
                    {errors && showError ? (
                        <Overlay>
                            <VStack
                                style={{
                                    width: "75%",
                                    maxWidth: "400px",
                                    backgroundColor: "var(--bg-default)",
                                    border: "1px solid var(--outline-default)",
                                    padding: "var(--space-16)",
                                    borderRadius: "var(--br-8)",
                                }}
                            >
                                <HStack
                                    style={{
                                        width: "100%",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                    }}
                                >
                                    <h1>Error</h1>
                                    <UnstyledButton onClick={() => setShowError(false)}>
                                        <X size={16} />
                                    </UnstyledButton>
                                </HStack>
                                <pre className="code-error">
                                    {errors.map((e) => e.formattedMessage || e.message || e).join("\n\n")}
                                </pre>
                            </VStack>
                        </Overlay>
                    ) : null}

                    {infos && showInfos ? (
                        <Overlay>
                            <VStack
                                style={{
                                    width: "75%",
                                    maxWidth: "400px",
                                    backgroundColor: "var(--bg-default)",
                                    border: "1px solid var(--outline-default)",
                                    padding: "var(--space-16)",
                                    borderRadius: "var(--br-8)",
                                }}
                            >
                                <HStack
                                    style={{
                                        width: "100%",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                    }}
                                >
                                    <h1>Success</h1>
                                    <UnstyledButton onClick={() => {
                                        setShowInfos(false);
                                        if (lastType == "Home") {
                                            location.replace("/");
                                        }
                                        else {
                                            location.reload();
                                        }
                                    }}>
                                        <X size={16} />
                                    </UnstyledButton>
                                </HStack>
                                <pre style={{ color: 'green' }}>
                                    {infos.join("\n\n")}
                                </pre>
                            </VStack>
                        </Overlay>
                    ) : null}
                </>

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
                        <Link
                            style={{
                                textDecoration: 'none'
                            }}
                            to="/"
                        >
                            <h1
                                className="main-title"
                                style={{ paddingBottom: "var(--space-8)" }}
                            >
                                Dapp 🤝 Marketplace
                            </h1>
                        </Link>
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
                                    tokenC={tokenC}
                                />
                                <Address address={ethers.utils.getAddress(walletAddress)} />
                            </HStack>

                            <RequestTKN />
                        </VStack>
                    ) : (
                        <button className="primary" onClick={connect}>
                            Connect wallet
                        </button>
                    )}

                </HStack>

                <HStack
                    style={{
                        alignItems: 'end',
                        justifyContent: "space-between"
                    }}
                >
                    <Link to="/register"
                        style={{
                            textDecoration: 'none'
                        }}
                    >
                        <OutlinedButton>
                            {!role ? ('Join the market') : ('See market role')}
                        </OutlinedButton>
                    </Link>

                    {role == memberManager.Role.Manager
                        ? (<Link to="/create" style={{
                            textDecoration: 'none'
                        }}>
                            <OutlinedButton>
                                Create a task
                            </OutlinedButton>
                        </Link>)
                        : null}
                </HStack>

                <Divider style={{ marginBottom: "var(--space-24)" }} />

                <Routes>
                    <Route path='/' element={
                        <Tasks
                            taskDatas={taskDatas}
                        />}
                    />
                    <Route path='/register' element={
                        <Register
                            walletAddress={walletAddress}
                            addMessage={addMessage}
                        />}
                    />
                    <Route path='/tasks/:taskId' element={
                        <Task
                            taskDatas={taskDatas}
                            role={role}
                            walletAddress={walletAddress}
                            addMessage={addMessage}
                        />
                    } />
                    <Route path='/create' element={<CreateTask addMessage={addMessage} />} />
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