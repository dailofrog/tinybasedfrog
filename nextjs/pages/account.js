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
let nftContractWriter = null;
let web3 = null;

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


    // frogs tokens
    const [tokensOwned, setTokensOwned] = useState(null);

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

        nftContract?.methods
            .totalSupply()
            .call()
            .then(function (result) {
                if ( result != totalSupply) {
                    console.log(`totalSupply changed to ${result}`);
                }

                setTotalSupply(result);
                //console.log("contract.totalSupply", result);
            });

        nftContract?.methods
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

        const alchemyUrl = FORCE_MAINNET ? 'https://base-mainnet.g.alchemy.com/v2/k5u1H1zQC3iHJZJGTUzZeUpw11HbzT0L' : 'https://base-sepolia.g.alchemy.com/v2/k5u1H1zQC3iHJZJGTUzZeUpw11HbzT0L';
        web3 = new Web3(alchemyUrl);
        //web3 = new Web3(window.ethereum);

        web3.eth.net.getId().then((netId) => {
            setEthNetworkId(netId);
        });


        //if (FORCE_MAINNET) {
            try {
                console.log("Trying to switch..");
              window.ethereum.request({
                method: "wallet_switchEthereumChain",
                params: [{ chainId: FORCE_MAINNET ? ETHNET_MAINNET_HEX : ETHNET_GOERLI_HEX }]
              });
            } catch (error) {
              alert(error.message);
            }
        //}

        nftContract = new web3.eth.Contract(
            contract.abi,
            CONTRACT_ADDRESS
        );

        // writer
        const web3Writer = new Web3(window.ethereum);
        nftContractWriter = new web3Writer.eth.Contract(
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

            nftContract?.methods
                .tokensOfOwner(account)
                .call()
                .then(function (result) {
                    console.log(result);
                    setTokensOwned(result);
                    /*result = parseInt(result);
                    setNumAlreadyOwnedInWallet(result);

                    const newMaxNumToMint = Math.max(0,maxMintsPerTransaction-result);
                    setNumToMintMax(newMaxNumToMint);

                    if (numToMint > newMaxNumToMint) {
                        setNumToMint(newMaxNumToMint);
                    }

                    console.log("contract.numberMinted (numAlreadyOwnedInWallet)=", result);
                    console.log("numToMintMax=", newMaxNumToMint);*/

                    setIsFetchingUserWalletInfo(false);
                });

            /*
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
                });*/

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

    const FrogSingle = (props) => {
        const tokenId = props.tokenId;

        const [txnHashSingle, setTxnHashSingle] = useState("");
        const [waitingForTxn, setWaitingForTxn] = useState(false);


        const [metadata, setMetadata] = useState(null);
        const [attributes, setAttributes] = useState(null);


        async function tryMorph() {
            try {
                setWaitingForTxn(true);
                setTxnHashSingle("");
                console.log(`Trying to morphFrog(${tokenId})`);

                const txParams = {
                    from: account,
                };

                nftContractWriter.methods
                    .morphFrog(tokenId)
                    .send(txParams)
                    .on("transactionHash", function (hash) {
                        console.log("transaction hash:", hash);
                        setTxnHashSingle(hash);
                    })
                    .on("confirmation", function (confirmationNumber, receipt) {
                        console.log("confirmationNumber", confirmationNumber);
                    })
                    .on('receipt', function(receipt) {
                        // receipt example
                        console.log(receipt);
                        setWaitingForTxn(false);

                        // refresh info
                        refreshTokenData();
                    })
                    .on('error', function(error){
                       // receipt example
                        console.log(error);
                        setWaitingForTxn(false);
                    });
            } catch (ex) {
                console.log("ERROR", ex);
            }
        }

        async function trySoulbind() {
            try {
                setWaitingForTxn(true);
                setTxnHashSingle("");
                console.log(`Trying to soulbindFrog(${tokenId})`);

                const txParams = {
                    from: account,
                };

                nftContractWriter.methods
                    .soulbindFrog(tokenId)
                    .send(txParams)
                    .on("transactionHash", function (hash) {
                        console.log("transaction hash:", hash);
                        setTxnHashSingle(hash);
                    })
                    .on("confirmation", function (confirmationNumber, receipt) {
                        console.log("confirmationNumber", confirmationNumber);
                    })
                    .on('receipt', function(receipt) {
                        // receipt example
                        console.log(receipt);
                        setWaitingForTxn(false);

                        // refresh info
                        refreshTokenData();
                    })
                    .on('error', function(error){
                       // receipt example
                        console.log(error);
                        setWaitingForTxn(false);
                    });
            } catch (ex) {
                console.log("ERROR", ex);
            }
        }

        async function tryBoil() {
            try {
                setWaitingForTxn(true);
                setTxnHashSingle("");
                console.log(`Trying to boilFrog(${tokenId})`);

                const txParams = {
                    from: account,
                };

                nftContractWriter.methods
                    .boilFrog(tokenId)
                    .send(txParams)
                    .on("transactionHash", function (hash) {
                        console.log("transaction hash:", hash);
                        setTxnHashSingle(hash);
                    })
                    .on("confirmation", function (confirmationNumber, receipt) {
                        console.log("confirmationNumber", confirmationNumber);
                    })
                    .on('receipt', function(receipt) {
                        // receipt example
                        console.log(receipt);
                        setWaitingForTxn(false);

                        // refresh info
                        refreshTokenData();
                    })
                    .on('error', function(error){
                       // receipt example
                        console.log(error);
                        setWaitingForTxn(false);
                    });
            } catch (ex) {
                console.log("ERROR", ex);
            }
        }

        function refreshTokenData() {
            if (tokenId != null) {

                nftContract?.methods
                .tokenURI(tokenId)
                .call()
                .then(function (result) {
                    //console.log("FROG SINGLE", result);

                    // Extract the Base64-encoded JSON string
                    let base64String = result.split("base64,")[1];

                    // Decode the Base64 string to get the JSON string
                    let jsonString = atob(base64String);

                    // Parse the JSON string into an object
                    let jsonObject = JSON.parse(jsonString);
                    

                    const attributesObj = jsonObject.attributes.reduce((acc, {trait_type, value}) => {
                        acc[trait_type] = value;
                        return acc;
                    }, {});

                    setAttributes(attributesObj);
                    setMetadata(jsonObject);

                    //console.log(jsonObject);
                    //console.log(attributesObj);
                });
            }
        }

        useEffect(()=>{
            refreshTokenData();
        }, [tokenId]);


        return (
            <>
                <Col xs={{ span: 12, offset: 0 }}>
                    <Row>
                        <div className="frogSingle">

                            {metadata && <>

                                <Row>
                                    <Col md={{ span: 6, offset: 0 }}>
                                        <Image fluid src={metadata.image}/>
                                    </Col>

                                    <Col md={{ span: 6, offset: 0 }}>
                                        <h3>Frog #{tokenId}</h3>
                                        <p>→ <a href={`https://opensea.io/assets/base/0xf0d0df7142f60f7f3847463a509fd8969e3e3a27/${tokenId}`} target="_blank">Opensea</a></p>
                                        <hr/>

                                        <ul>
                                            {metadata.attributes.map((item,index)=>
                                                <li key={index}>
                                                    <span className="attributeType">{item.trait_type}:</span> <span className="attributeValue">{item.value}</span>
                                                </li>
                                            )}
                                        </ul>

                                        <hr/>

                                        {txnHashSingle != "" && (
                                            <div>
                                                <Alert variant="success">
                                                    ☑️ <strong>Transaction Sent!</strong><br/>
                                                    <a
                                                        target="_blank"
                                                        href={FORCE_MAINNET? `https://basescan.org/tx/${txnHashSingle}` : `https://sepolia.basescan.org/tx/${txnHashSingle}`}
                                                    >
                                                        View on Explorer
                                                    </a>
                                                </Alert>
                                            </div>
                                        )}

                                        <p>⚠️ Actions are irreversible! <a href="/">Read</a></p>
                                        <Button disabled={waitingForTxn || attributes["Soulbound"]=="Yes" || attributes["Alive"]=="No"} onClick={tryMorph} >🎲 Morph</Button>
                                        <Button disabled={waitingForTxn || attributes["Soulbound"]=="Yes" || attributes["Alive"]=="No"} onClick={trySoulbind}>🕶️ Become Based</Button>
                                        <Button disabled={waitingForTxn || attributes["Soulbound"]=="Yes" || attributes["Alive"]=="No"} onClick={tryBoil}>♨️ Boil</Button>
                                    </Col>

                                </Row>
                            </>}
                            
                            {/*<pre>{metadata && 
                                JSON.stringify(metadata, null, 2)
                            }</pre>*/}
                        </div>
                    </Row>
                </Col>
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
                                href={FORCE_MAINNET? `https://basescan.org/tx/${transactionHash}` : `https://sepolia.basescan.org/tx/${transactionHash}`}
                            >
                                View on Explorer
                            </a>
                        </Alert>
                    </div>
                )}

                <p>CONNECTED:<br/><span className="ethAccount" >🟢 {account}</span></p>
                <p>{' '}</p>

                {isFetchingUserWalletInfo && <Button disabled>Loading...</Button>}

                {tokensOwned && <h2>You currently own {tokensOwned.length} frog{tokensOwned.length>1?"s":""}:</h2>}
                {tokensOwned && <Row>{tokensOwned.map( (tokenId,index)=> <FrogSingle key={tokenId} tokenId={tokenId}/> )}</Row>}
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

                {!active ? (

   
                        (
                            <>
                            {/*<Image className="selector handpoint d-none d-lg-inline" src={imgGlovePoint.src} width={64}  />
                            <Nbsp/>*/}
                            {/*<a href="#" onClick={connect}><Image className="selector" src={imgConnectButton.src} width={350}  /></a>*/}
                            <p>Connect wallet to manage your tiny frogs:</p> 
                            <Button onClick={connect} size="lg">
                                connect
                            </Button>
                            <br/>
                            <br/>
                            </>
                        )
                ) : (
                    <ConnectedSuccessfulSection />
                )}
                
            </div>
        </>
    );
};

const Header = () => {

    const metaTitle = "tiny based frogs";
    const url = "https://tinybasedfrogs.xyz/";

    const META_DESC = "Tiny Based Frogs is Base's first 100% fully onchain dynamic NFT collection, featuring unfathomly based onchain interactive mechanics.";
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

const HeroWindow = () => { 



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

                <Col md={{ span: 12, offset: 0 }} className="text-center">

                    <Image className="selector "src={imgFrogVariations.src} fluid width={10000} height={10000} /> 

                    <hr/>

                    <Row>
                        < MintSection/>
                    </Row>
                    <hr/>

                    {/*
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
    */}
                    <p>← <a href="/">return</a></p>
                    <p>© 2024 Dailofrog Technologies. All Rights Reserved.</p>

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
            
            {/*<Container fluid className="headerTop">
                <Container>
                <Col xl={{ span: 6, offset: 3 }}
                    lg={{ span: 8, offset: 2 }}
                    md={{ span: 12, offset: 0 }}
                    sm={{ span: 12, offset: 0 }}>
                    <Image className="selector "src={imgPond.src} fluid width={10000} height={10000} /> 
                </Col>
                </Container>
            </Container>
*/}
            <Container className="">

                    <>
                        <HeroWindow/>
                        <p><Nbsp /></p>
                        

                        
                            </>
            </Container>
        </>
    );
}
