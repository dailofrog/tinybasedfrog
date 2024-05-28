import Head from "next/head";

import Container from "react-bootstrap/Container";
import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";
import Button from "react-bootstrap/Button";
import Navbar from "react-bootstrap/Navbar";
import Nav from "react-bootstrap/Nav";
import Stack from "react-bootstrap/Stack";
import Alert from "react-bootstrap/Alert";
import Image from "react-bootstrap/Image";
import Form from "react-bootstrap/Form";
import Table from "react-bootstrap/Table";
import InputGroup from "react-bootstrap/InputGroup";
import FormControl from "react-bootstrap/FormControl";
import { useState, useEffect } from "react";
import { useInterval } from '../components/util/hooks'

import { useWeb3React } from "@web3-react/core";
import Web3 from "web3";
import { injected } from "../components/wallet/connectors";
import  {links, CONTRACT_ADDRESS, FORCE_MAINNET, STAY_MYSTERIOUS}  from "../components/data";

// images REMOVE
import imgEgg from "../public/tinyfrogs/egg.png";
import imgTadpole from "../public/tinyfrogs/tadpole.png";

import imgIcon from "../public/tinyfrogs/frogicon.png";
import imgPond from "../public/tinyfrogs/pond.png";
import imgFrogHero from "../public/tinyfrogs/frog-animated.gif";
import imgBgSide from "../public/tinyfrogs/bg-side.png";
import imgFrogLineup from "../public/tinyfrogs/froglineup-transparent.png";
import imgFrogOnLeaf from "../public/tinyfrogs/frog-leaf.png";
import imgFrogVariations from "../public/tinyfrogs/frog-variations.png";

import imgMechanicsReveal from "../public/tinyfrogs/mechanics-reveal.png";
import imgMechanicsMorph from "../public/tinyfrogs/mechanics-morph.png";
import imgMechanicsBase from "../public/tinyfrogs/mechanics-base.png";


// social
import imgSocialOpensea from "../public/socialmedia/opensea.png";
import imgSocialEtherscan from "../public/socialmedia/etherscan.png";
import imgSocialDiscord from "../public/socialmedia/discord.png";
import imgSocialTwitter from "../public/socialmedia/twitter.png";
import imgSocialLooksRare from "../public/socialmedia/looksrare.png";


const contract = require("../components/contracts/TinyFrog.json");
let nftContract = null;
let web3 = null;


const mintingNotLiveMsg = `Minting soon!`;

const ETHNET_MAINNET = 8453; // base mainnet
const ETHNET_GOERLI = 84532; // base (goerli)

const ETHNET_MAINNET_HEX = "0x2105";
const ETHNET_GOERLI_HEX = "0x14A34";


const BackgroundImagePage = function (props) {
    useEffect(() => {
        document.body.style.backgroundImage = "url(" + props.image.src + ")";
        document.body.style.backgroundPosition = "center";
        document.body.style.backgroundSize = "initial";
        document.body.style.backgroundAttachment = "fixed";
        document.body.style.minHeight = "100vh";
    });
    return <></>;
};

const TextLink = function(props) {
    return <a href={props.link} target="_blank">{props.text}</a>;
}

const ImageFrogIcon = function(props) {
    return <Image className="selector"src={imgIcon.src} />;
}

const Nbsp  = () => '\u00A0';


const MintSection = function (props) {
    // from eth
    const [transactionHash, setTransactionHash] = useState("");
    const [ethNetworkId, setEthNetworkId] = useState(0);

    // from contract
    const [totalSupply, setTotalSupply] = useState(1000);
    const [maxSupply, setMaxSupply] = useState(1000);
    const [publicSaleIsActive, setPublicSaleIsActive] = useState(false);
    const [maxTokensOwnedInWallet, setMaxTokensOwnedInWallet] = useState(1);
    const [maxMintsPerTransaction, setMaxMintsPerTransaction] = useState(10);

    //
    const [mintSupplyLimits, setMintSupplyLimits] = useState([]);
    const [mintPricing, setMintPricing] = useState([]);
    
    // user info
    const [numAlreadyOwnedInWallet, setNumAlreadyOwnedInWallet] = useState(0);

    const [pricePerMint, setPricePerMint] = useState(-1); 

    // dynamic
    const [numToMint, setNumToMint] = useState(1);
    const [numToMintMax, setNumToMintMax] = useState(100);
    const [numToMintMin, setNumToMintMin] = useState(1);
    const [isFetchingUserWalletInfo, setIsFetchingUserWalletInfo] = useState(false);
    const [isWhitelisted, setIsWhitelisted] = useState(false);
    const [waitingForTransactionToComplete, setWaitingForTransactionToComplete] = useState(false);

    const {
        chainId,
        error,
        networkId,
        active,
        account,
        library,
        connector,
        activate,
        deactivate,
    } = useWeb3React();

    function refreshTotalSupply() {
        return;

        nftContract.methods
            .totalSupply()
            .call()
            .then(function (result) {
                if ( result != totalSupply) {
                    console.log(`totalSupply changed to ${result}`);
                }

                setTotalSupply(result);
                //console.log("contract.totalSupply", result);
            });

        nftContract.methods
            .getPrice(1)
            .call()
            .then(function (result) {
                let priceEth = parseFloat(Web3.utils.fromWei(result, 'ether'));
                setPricePerMint(priceEth);
                console.log("contract.getPrice=", priceEth);
            });
    }

    /*useInterval(async () => {
        //console.log("Checking totalSupply..");

        if (totalSupply < maxSupply)
        {
            refreshTotalSupply();
        }
            
    }, 12000);*/

    useEffect(() => {
        if (!window.ethereum) 
            return;

        web3 = new Web3(window.ethereum);

        web3.eth.net.getId().then((netId) => {
            setEthNetworkId(netId);
        });

/*
        //if (FORCE_MAINNET) {
            try {
                console.log("Trying to switch..");
              web3.currentProvider.request({
                method: "wallet_switchEthereumChain",
                params: [{ chainId: FORCE_MAINNET ? ETHNET_MAINNET_HEX : ETHNET_GOERLI_HEX }]
              });
            } catch (error) {
              alert(error.message);
            }
        //}*/

        nftContract = new web3.eth.Contract(
            contract.abi,
            CONTRACT_ADDRESS
        );


        // detect Network account change
        window.ethereum.on('chainChanged', function(networkId){
          setEthNetworkId(networkId);
        });
        
    }, []);

    const fetchData = async () => {
        console.log("fetchData()");

        //await window.ethereum.enable();
        try {
            refreshTotalSupply();


            nftContract.methods
                .MAX_TOKEN_SUPPLY()
                .call()
                .then(function (result) {
                    setMaxSupply(parseInt(result));
                    console.log("contract.MAX_TOKEN_SUPPLY=", result);
                });

            const NUM_PRICING_TIERS = 4;

            // supply limits
            {
                let promisesSupplyLimits = Array.from({length: NUM_PRICING_TIERS}, (_, i) => 
                    nftContract.methods.mintSupplyLimits(i).call()
                );

                let promisesPricing = Array.from({length: NUM_PRICING_TIERS}, (_, i) => 
                    nftContract.methods.mintPricing(i).call()
                );

                Promise.all(promisesSupplyLimits)
                    .then((results) => {
                        setMintSupplyLimits(results);
                        console.log("Tiered mint supply limits:", results);
                    })
                    .catch((err) => {
                        console.error("Error while fetching mint supply limits:", err);
                    });

                Promise.all(promisesPricing)
                    .then((results) => {
                        let resultsInEther = results.map(result => Web3.utils.fromWei(result, 'ether'));
                        setMintPricing(resultsInEther);
                        console.log("Tiered mint pricing:", results);
                        console.log("Tiered mint pricing (ether):", resultsInEther);
                    })
                    .catch((err) => {
                        console.error("Error while fetching mint supply limits:", err);
                    });
            }

/*

            for(let i = 0; i < NUM_PRICING_TIERS; ++i ) {
                nftContract.methods
                    .mintSupplyLimits(i)
                    .call()
                    .then(function (result) {
                        console.log(`contract.mintSupplyLimits[${i}]=${result}`);

                        let newItems = [...mintSupplyLimits];
                        newItems[i] = result;
                        setMintSupplyLimits(newItems);

                        //let priceEth = parseFloat(Web3.utils.fromWei(result, 'ether'));
                        //setPricePerMint(priceEth);
                        //console.log("contract.setPricePerMint=", priceEth);
                    });
            }*/

            /*nftContract.methods
                .price()
                .call()
                .then(function (result) {
                    let priceEth = parseFloat(Web3.utils.fromWei(result, 'ether'));
                    setPricePerMint(priceEth);
                    console.log("contract.setPricePerMint=", priceEth);
                });

            nftContract.methods
                .maxMintsPerTransaction()
                .call()
                .then(function (result) {
                    setMaxMintsPerTransaction(parseInt(result));
                    console.log("contract.setMaxMintsPerTransaction=", result);
                });*/

            nftContract.methods
                .maxTokensOwnableInWallet()
                .call()
                .then(function (result) {
                    setMaxTokensOwnedInWallet(parseInt(result));
                    setMaxMintsPerTransaction(parseInt(result));
                    console.log("contract.setMaxTokensOwnedInWallet=", result);
                });

            nftContract.methods
                .mintStatus()
                .call()
                .then(function (result) {
                    console.log("contract.mintStatus=", result)
                    setPublicSaleIsActive(result == 1);
                });

            console.log("contract", nftContract);
        } catch (error) {
            console.error("ERROR", error);
        }
    };

    const fetchWalletOwnershipInfo = async () => {
        console.log("fetchWalletOwnershipInfo for wallet", account);
        setIsFetchingUserWalletInfo(true);

        // reset
        setNumAlreadyOwnedInWallet(0);
        setIsWhitelisted(false);
        
        try {

            nftContract.methods
                .numberMinted(account)
                .call()
                .then(function (result) {
                    result = parseInt(result);
                    setNumAlreadyOwnedInWallet(result);

                    const newMaxNumToMint = Math.max(0,maxMintsPerTransaction-result);
                    setNumToMintMax(newMaxNumToMint);

                    if (numToMint > newMaxNumToMint) {
                        setNumToMint(newMaxNumToMint);
                    }

                    console.log("contract.numberMinted (numAlreadyOwnedInWallet)=", result);
                    console.log("numToMintMax=", newMaxNumToMint);

                    setIsFetchingUserWalletInfo(false);
                });

        } catch (error) {
            console.error(error);
        }
    };

    useEffect(()=> {
        if (ethNetworkId==0)
            return;

        console.log("ethNetworkId", ethNetworkId);

        switch (ethNetworkId) {
            case ETHNET_MAINNET:
                console.log(`This is Base mainnet: ${ethNetworkId}`);
                break;
            case ETHNET_GOERLI:
                console.log(`This is the Goerli test network: ${ethNetworkId}`);
                break;
            default:
                console.log(`This is an unknown network: ${ethNetworkId}`);
        }

        fetchData();
    }, [ethNetworkId]);

    useEffect(() => {
        console.log(`Logged in with account ${account}`);
        // check to see if presale

        setNumToMint(1);

        if (account) {
            fetchWalletOwnershipInfo();
        }
    }, [account]);

    async function connect() {

        try {
            console.log("Trying to connection...");
            await activate(injected);
        } catch (ex) {
            console.log(ex);
        }
    }

    async function disconnect() {
        try {
            console.log("Trying to disconnect...");
            deactivate();
        } catch (ex) {
            console.log(ex);
        }
    }

    

    const MintButtons = () => {

        const SingleMysteryChracter = () => {return (<Image className="selector"src={imgTadpole.src} width={64} height={64} />)}

        const numToMintPaid = numToMint;//
        const totalEthCost = Math.round(numToMintPaid*pricePerMint*1000) / 1000.0;

        function mintDelta(delta)  {
            let newNumber = numToMint+delta;
            newNumber = Math.max(newNumber, 0);
            setNumToMint(newNumber);
        }

        function mintAdd() {
            mintDelta(1);
        }

        function mintSub() {
            mintDelta(-1);
        }

        async function tryMint() {
            try {
                setTransactionHash("");
                console.log(`Trying to public mint ${numToMintPaid} at total ${totalEthCost} Eth`);

                const txParams = {
                    from: account,
                    value: Web3.utils.toWei(totalEthCost.toString(), "ether"),
                };

                console.log(JSON.parse(JSON.stringify(txParams)));

                nftContract.methods
                    .publicMintFrog(numToMintPaid)
                    .send(txParams)
                    .on("transactionHash", function (hash) {
                        console.log("transaction hash:", hash);
                        setTransactionHash(hash);
                    })
                    .on("confirmation", function (confirmationNumber, receipt) {
                        console.log("confirmationNumber", confirmationNumber);
                    })
                    .on('receipt', function(receipt) {
                        // receipt example
                        console.log(receipt);
                        setWaitingForTransactionToComplete(false);

                        // refresh info
                        refreshTotalSupply();
                        fetchWalletOwnershipInfo();
                    })
                    .on('error', function(error){
                       // receipt example
                        console.log(error);
                        setWaitingForTransactionToComplete(false);
                    });
            } catch (ex) {
                console.log("ERROR", ex);
            }
        }

        async function onClickedMint() {
            setWaitingForTransactionToComplete(true);

            tryMint(); 
        }

        return (
            <>
                <Col xs={{ span: 12, offset: 0 }} className="mint-btns">

                    <Button
                        disabled = {waitingForTransactionToComplete || numToMint <= numToMintMin}
                            onClick={mintSub}
                            variant="outline-secondary"
                        >-</Button>
                    <Button
                            onClick={onClickedMint} 
                            variant="outline-secondary"
                            disabled={waitingForTransactionToComplete || (numToMint==0)}
                        >
                            {waitingForTransactionToComplete ? `minting ${numToMint}..` : `mint ${numToMint}`}
                    </Button>
                    <Button
                        disabled = {waitingForTransactionToComplete || numToMint >= numToMintMax}
                            onClick={mintAdd}
                            variant="outline-secondary"
                        >+</Button>
                </Col>
                <p>{' '}</p>

                {numAlreadyOwnedInWallet > 0 && <span>You currently own {numAlreadyOwnedInWallet} frogs!</span>}
                <Alert variant="primary" className="text-center" hidden={numToMint==0}>{numAlreadyOwnedInWallet>=maxTokensOwnedInWallet && `You reached max mint of ${maxTokensOwnedInWallet} per wallet during this pricing tier!` }{Array(numToMint).fill(1).map( (blah,index)=> <SingleMysteryChracter key={index}/> )}</Alert>
                
                {numAlreadyOwnedInWallet<maxTokensOwnedInWallet && <>

                    

                <div className="checkoutTotal">
                    <strong>Total</strong>
                    <br/>
                    {`${numToMintPaid} FROG${numToMintPaid!=1?"s":""} x ${pricePerMint}Ξ`}
                    <p style={{fontSize:"3em", marginTop:"0.6em"}}>{totalEthCost==0 ? "Free" : `${totalEthCost}Ξ`}</p></div></>}
                
            </>
        );
    };

    const PricingSection= () => {


        return (
            <>
                <h2>Pricing Tiers:</h2>
                 <Table bordered hover>
                  <thead>
                    <tr>
                      <th></th>
                      <th>Token ID</th>
                      <th>Price Per Mint</th>
                    </tr>
                  </thead>
                  <tbody>

                    {mintPricing.map((price, index) => (
                        <tr key={index} className={mintPricing[index] <= pricePerMint?"strikeout":(mintPricing[index] == pricePerMint ?"highlight":"")}>
                            <td>{mintPricing[index] == pricePerMint ? "👉":""}</td>
                          <td><ImageFrogIcon/> {Math.max(1,mintSupplyLimits[index])} - {index+1==mintSupplyLimits.length? maxSupply :mintSupplyLimits[index+1]-1}</td>
                          <td>{mintPricing[index]}Ξ</td>
                        </tr>

                      ))}
                  </tbody>
                </Table>
                <span>Max {maxMintsPerTransaction} per wallet</span>

                    {/*<br/>
                    {pricePerMint<0?"-":pricePerMint}Ξ each, max <ImageFrogIcon/>{maxTokensOwnedInWallet}*/}
            </>
        )
    }


    const ConnectedSuccessfulSection = () => {
        return (
            <>
                {transactionHash != "" && (
                    <div>
                        <Alert variant="success">
                            ☑️ <strong>Transaction Sent!</strong><br/>
                            <a
                                target="_blank"
                                href={FORCE_MAINNET? `https://basescan.org/tx/${transactionHash}` : `https://goerli.basescan.org/tx/${transactionHash}`}
                            >
                                View on Explorer
                            </a>
                        </Alert>
                    </div>
                )}

                <p>YOU'RE CONNECTED!<br/><span className="ethAccount" >🟢 {account}</span></p>
                <p>{' '}</p>

                {isFetchingUserWalletInfo? <Button disabled>Loading...</Button> : 
                (publicSaleIsActive ? (
                    <MintButtons />
                ) : (
                    <Button disabled>{mintingNotLiveMsg}</Button>
                ))
            }
            </>
        );
    };

    const ShowGoerliDebug = (props) => {
        return ( 
    <>
        { !FORCE_MAINNET && props.visible && (
          
            <Alert>
                <p>
                    {`RINKEBY`}
                    <br/>
                    <a href={`https://rinkeby.etherscan.io/address/${CONTRACT_ADDRESS}#writeContract`} target="_blank">{CONTRACT_ADDRESS}</a>
                    <br/>
                    <a href={`https://testnets.opensea.io/assets/rinkeby/${CONTRACT_ADDRESS}/1`} target="_blank">Testnet Opensea</a>
                </p>
            </Alert>
            
        )}
        </>
        )
    }

    if (error) console.log(Object.keys(error));

    return (
        <>
            <ShowGoerliDebug visible={false}/>
            {false && FORCE_MAINNET && ethNetworkId != ETHNET_MAINNET && (
                <div>
                    <Alert variant="danger">
                        ⚠️ Please connect to BASE and refresh!
                    </Alert>
                </div>
            )}

            {error && (
                <div>
                    <Alert variant="danger">
                        <Alert.Heading>⚠️ Error!</Alert.Heading>
                        {error.message}
                    </Alert>
                </div>
            )}

            <div>

            <p>{''}</p>

                {totalSupply == maxSupply ? (
                    <Button disabled size="lg">
                        minted out!
                    </Button>
                ) : !active ? (

                    !(publicSaleIsActive && !STAY_MYSTERIOUS) ? 
                        (<><Button disabled>{mintingNotLiveMsg}</Button><br/><p>August 9 @ 11am PST</p></>)
                        :
                        (
                            <>
                            {/*<Image className="selector handpoint d-none d-lg-inline" src={imgGlovePoint.src} width={64}  />
                            <Nbsp/>*/}
                            {/*<a href="#" onClick={connect}><Image className="selector" src={imgConnectButton.src} width={350}  /></a>*/}
                            <Button onClick={connect} size="lg">
                                connect
                            </Button>
                            </>
                        )
                ) : (
                    <ConnectedSuccessfulSection />
                )}
                
                <p><span>{totalSupply == maxSupply?"✔️":""}</span>{totalSupply == -1 ? "--" : totalSupply}/{maxSupply}</p>

                <p>Buy now on <Image className="selector" src={imgSocialOpensea.src} height={18} /> <a target="_blank" href={links.opensea}>Opensea</a></p>
                <p className="toolhighlight">Use <a href="/account">this tool</a> to manage your frogs</p>
                {/*!STAY_MYSTERIOUS && <PricingSection/>*/}
                {STAY_MYSTERIOUS && <p><br/><Image className="selector" src={imgSocialEtherscan.src} height={16} /> <a href={links.etherscan} target="_blank">view contract</a></p>}
                
            </div>
        </>
    );
};

const Header = () => {

    const metaTitle = "tiny based frogs";
    const url = "https://tinybasedfrogs.xyz/";

    const META_DESC = "Tiny Based Frogs is Base's first NFT collection and first 100% fully onchain dynamic NFT collection, featuring unfathomly based onchain interactive mechanics.";
    const imgMetaCard =  imgPond;

    const faviconDir =  `/favicon/`;

    return (
        <Head>
            <title>{metaTitle}</title>
            <meta name="title" content={metaTitle}/>
            <meta name="description" content={META_DESC}/>

            <link rel="icon" href={`${faviconDir}favicon.ico`}/>
            <link rel="apple-touch-icon" sizes="180x180" href={`${faviconDir}apple-touch-icon.png`}/>
            <link rel="icon" type="image/png" sizes="32x32" href={`${faviconDir}favicon-32x32.png`}/>
            <link rel="icon" type="image/png" sizes="16x16" href={`${faviconDir}favicon-16x16.png`}/>
            <link rel="manifest" href={`${faviconDir}site.webmanifest`}/>

            <meta property="og:type" content="website" />
            <meta property="og:title" content={metaTitle} key="og:title" />
            <meta property="og:url" content={url} key="og:url" />
            <meta property="og:description" content={META_DESC} key="og:description" />
            <meta property="og:image" content={imgMetaCard.src} key="og:image" />
            <meta property="og:site_name" content={metaTitle} key="og:site_name" />

            <meta property="twitter:card" content="summary_large_image"/>
            <meta property="twitter:url" content={url}/>
            <meta property="twitter:title" content={metaTitle}/>
            <meta property="twitter:description" content={META_DESC}/>
            <meta property="twitter:image" content={imgMetaCard.src}/>
        </Head>
    )
};

const FAQWindow = () => { 

    return (
        <Col
            xl={{ span: 8, offset: 2 }}
            lg={{ span: 10, offset: 1 }}
            md={{ span: 12, offset: 0 }}
            sm={{ span: 12, offset: 0 }}
            className="faqSection"
        >
            <Col className="text-center">
                <h1>FAQ</h1>
            </Col>

            <Row className="faqitem">
                <h2>What makes Tiny Based Frogs unique?</h2>
                <p>Tiny Based Frogs are Base's first NFT collection and first 100% onchain NFT art collection, launching on Base's public mainnet release in August 9th. Also, cute and comfy lil frogs with onchain mechanics are based or nah?</p>
            </Row>

            <Row className="faqitem">
                <h2>Why Base?</h2>
                <p>We are bullish on Coinbase's ability to leverage their bigly userbase onto their new L2. Also, Brian Armstrong is pretty based.</p><p>Bullish on baldness.</p>
            </Row>

            <Row className="faqitem">
                <h2>Why be fully onchain?</h2>
                <p>We are onchain purists and simply don't want to rely on no off-chain storage solutions for this project's long-term survival, like IPFS or Arweave.</p><p>We believe in the decentralized and fully onchain future of crypto-art. We die with the chain like real men.</p>
            </Row>

            <Row className="faqitem">
                <h2>How are these fully onchain?</h2>
                <p>We've engineered custom code that converts pixel art layers directly into Solidity bytecode, thus allowing the art to persist fully onchain by embedding all the image layers directly into the <a href={links.etherscan} target="_blank">contract</a>.</p><p>Our custom render engine "based froggy ribbitizer v4.20" interprets the solidity bytecode and renders the final art as SVG rects. The SVG art is loseless, fully scalable and, best of all, fully onchain!</p>
            </Row>

            <Row className="faqitem">
                <h2>How many variations are there?</h2>
                <p>There are roughly 1.9 million potential visual variations of onchain frogs, including visual traits and colors. Colors are inspired by classic NES color palettes.</p>
                <Image className="selector "src={imgFrogVariations.src} /> 
            </Row>

            <Row className="faqitem">
                <h2>How does my NFT metadata get updated?</h2>
                <p>We've integrated the <a href="https://eips.ethereum.org/EIPS/eip-4906" target="_blank">ERC-4906 standard</a> of emitting Events whenever an onchain activity results in any change of your NFT's visuals. These events alert storefronts like Opensea to refresh the NFT's metadata and re-render your newly updated image directly from the <a href={links.etherscan} target="_blank">contract</a>.</p>
                <p>If the storefront doesn't support these event standards, simply refresh the metadata on the storepage whenever you enact any onchain actions.</p>
            </Row>

            <Row className="faqitem">
                <h2>How does soulbound work?</h2>
                <p>If your frog dies or becomes "based", the NFT itself will become fully "soulbound" into your wallet, meaning that the NFT is no-longer transferrable.</p>
                <p>Being non-transferrable prevents you from transferring that NFT to another wallet. It is forever within your humble embrace.</p>
                <p>Mechanically how this works is by reverting function calls for any transfers of soulbound NFTs. We also emit lock events to inform storefronts like Opensea that this NFT is non-sellable.</p>
                <p>⚠️ Note that any soulbound action is irreversible! ⚠️</p>
            </Row>

            <Row className="faqitem">
                <h2>Why soulbound?</h2>
                <p>Providing users the option to change the transfer-ability of your NFT carries weight and makes onchain choices meaningful.</p>
            </Row>

            <Row className="faqitem">
                <h2>Any roadmap?</h2>
                <p>No roadmap!</p>
                <p>Simply put, this project is meant to be a fun historical onchain art interative experiment. Do not expect any utility or anything more than what is laid out on this page.</p>
            </Row>

            <Row className="faqitem">
                <h2>How do we stay connected?</h2>
                <p>Follow on <a target="_blank" href={links.twitter}>twitter</a> or <a target="_blank" href={links.discord}>discord</a>.</p>
            </Row>

            <Row className="faqitem">
                <h2>Wen mint?</h2>
                <p>Update: Sold out!</p>
                <p>Public mint began on <a href="https://base.org/" target="_blank">Base's public mainnet</a> launch day in August 9 2023 at 11am PST. </p>
            </Row>

        </Col>
    )
}


const MechanicsWindow = () => { 

    return (
        <Col
            xl={{ span: 8, offset: 2 }}
            lg={{ span: 10, offset: 1 }}
            md={{ span: 12, offset: 0 }}
            sm={{ span: 12, offset: 0 }}
        >
            <Col className="text-center">
                <h1>ONCHAIN<br/>MECHANICS</h1>
            </Col>

            <p>Below are some onchain mechanics that are available within the NFT. All interactions occur onchain thru the <a href={links.etherscan} target="_blank">smart contract</a> and will affect the visuals and metadata of the NFT.</p>

            <Row className="faqitem">
                <h2>1. Reveal</h2>
                <p>Image and metadata reveal will occur after public mint begins. A new frog is born!</p>

                <Col md={{ span: 10, offset: 1 }}  >
                    <Image className="selector "src={imgMechanicsReveal.src} fluid/> 
                </Col>
            </Row>

            <Row className="faqitem">
                <h2>2. Morph</h2>
                <p>The owner can choose to "morph" their frog into a brand new frog. Doing so will re-roll the frog and completely randomize its visuals and metadata.</p>
                <p>However, there is a 33% chance of death whenever the frog is morphed. If your frog dies, the visuals will permanently render as a deadass frog and your NFT will become forever soulbound to your wallet.</p>

                <p>💀 Please use <a href="/account">this tool</a> to morph.  Frog deaths are permanent and irreversible! 💀</p>

                <Col md={{ span: 10, offset: 1 }}  >
                    <Image className="selector "src={imgMechanicsMorph.src} fluid/> 
                </Col>
            </Row>

            <Row className="faqitem">
                <h2>2. Become "Based"</h2>
                <p>The owner can also choose to make their frog completely "based", which provides your frog with a new solid platform to stand on.</p>
                <p>Please use <a href="/account">this tool</a> to become based.</p>
                <p>⚠️ This action permantly "soulbinds" the NFT to your wallet and is irreversible, so please apply discretion when becoming unfathomly based.</p>

                <Col md={{ span: 10, offset: 1 }}  >
                    <Image className="selector "src={imgMechanicsBase.src} fluid/> 
                </Col>
            </Row>

        </Col>
    )
}

const HeroWindow = () => { 

    const MysteriousMint = () =>{
        return (
            <>
                <Col sm={{span:10, offset:1}} style={{marginTop:"30px"}}>
                <Button disabled = {true} variant="outline-secondary">{mintingNotLiveMsg}</Button>
                <p>Minting available on <a href="https://base.org/" target="_blank">Base's public release</a> in early August, maybe next week?</p>
                </Col>
            </>
        )
    }


    return (
        <Col
            xl={{ span: 8, offset: 2 }}
            lg={{ span: 10, offset: 1 }}
            md={{ span: 12, offset: 0 }}
            sm={{ span: 12, offset: 0 }}
            className="d-grid gap-5 mintSection"
        >
            <Row className="align-items-center">
               
                <p>{" "}</p>

                <Col xs={{span:6, offset:3}} md={{ span: 5, offset: 0 }} className="text-center">
                    <Image className="selector "src={imgFrogHero.src} fluid width={10000} height={10000} className="hero"/> 
                </Col>

                <Col md={{ span: 7, offset: 0 }} className="text-center">

                    <Row>
                        <p><strong>Tiny Based Frogs</strong> is 🔵<a href="https://base.org/" target="_blank">Base's</a> first NFT collection and first 100% fully onchain dynamic NFT collection, featuring unfathomly based onchain interactive + deflationary mechanics.</p>
                    </Row>

                    <Row>
                        <Col>
                        <a target="_blank" href={links.twitter}><Image className="selector" src={imgSocialTwitter.src} height={16} /></a>
                        {" "}
                        <a target="_blank" href={links.discord}><Image className="selector" src={imgSocialDiscord.src} height={16} /></a>
                        {" "}
                        {!STAY_MYSTERIOUS && <a target="_blank" href={links.opensea}><Image className="selector" src={imgSocialOpensea.src} height={18} /></a>}
                        {" "}
                        <a target="_blank" href={links.etherscan}><Image className="selector" src={imgSocialEtherscan.src} height={16} /></a>
                        </Col>
                    </Row>

                    <Row>
                        {/*STAY_MYSTERIOUS ? <MysteriousMint/>: < MintSection/>*/}
                        < MintSection/>
                    </Row>
                </Col>
            </Row>

        </Col>
    )
}

export default function Home() {

    //const [stayMysterious, setStayMysterious] = useState(STAY_MYSTERIOUS);

    /*useEffect(() => {
        // Returns a URLSearchParams object instance
        let parameterList = new URLSearchParams(window.location.search);
        console.log("Parameters", parameterList);
        console.log("REVEALED", parameterList.get("reveal"));

        setStayMysterious(parameterList.get("reveal") != "true");
    }, []);*/


    return (
        <>
            <Header/>
            
            <Container fluid className="headerTop">
                <Container>
                <Col xl={{ span: 6, offset: 3 }}
                    lg={{ span: 8, offset: 2 }}
                    md={{ span: 12, offset: 0 }}
                    sm={{ span: 12, offset: 0 }}>
                    <Image className="selector "src={imgPond.src} fluid width={10000} height={10000} /> 
                </Col>
                </Container>
            </Container>

            <Container className="">

                    <>
                        <HeroWindow/>
                        <p><Nbsp /></p>
                        
                        <MechanicsWindow/>

                        <Row style={{margin:"110px 0 50px 0"}}>
                            <Col lg={{span:12, offset: 0}} >
                                <Image className="selector "src={imgFrogLineup.src} rounded={true} fluid width={10000} height={100} /> 
                                <p className="text-center">examples of tiny based frogs rendered onchain via contract</p>
                            </Col>
                        </Row>

                        <FAQWindow/>

                        
                            </>
            </Container>
            <hr/>
            <p className="text-center">© 2024 Dailofrog Technologies. All Rights Reserved.</p>
            <p className="text-center"><Image className="selector "src={imgFrogOnLeaf.src} /> </p>
        </>
    );
}
