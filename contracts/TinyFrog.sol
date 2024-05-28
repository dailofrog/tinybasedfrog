// SPDX-License-Identifier: MIT

/**
              @..@
             (----)
            ( >__< )
            ^^ ~~ ^^
             
           * ribbit *
**/

pragma solidity ^0.8.4;

import "erc721a/contracts/ERC721A.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import 'base64-sol/base64.sol';

import "./ITinyFrogRenderer.sol";
import "./TinyFrogRenderer.sol";

/// @title EIP-721 Metadata Update Extension
interface IERC4906 {
    /// @dev This event emits when the metadata of a token is changed.
    /// So that the third-party platforms such as NFT market could
    /// timely update the images and related attributes of the NFT.
    event MetadataUpdate(uint256 _tokenId);

    /// @dev This event emits when the metadata of a range of tokens is changed.
    /// So that the third-party platforms such as NFT market could
    /// timely update the images and related attributes of the NFTs.    
    event BatchMetadataUpdate(uint256 _fromTokenId, uint256 _toTokenId);
}

/// @title Tiny Based Frog
/// @author @dailo3000
/// @notice Tiny Based Frog is an interactive 100% fully on-chain tiny friend
//contract TinyFrog is ERC721A, Ownable {
contract TinyFrog is TinyFrogRenderer, ERC721A, IERC4906, Ownable {
    
    uint256 public MAX_TOKEN_SUPPLY = 1000;

    // 3 pricing tiers
    uint256[] public mintSupplyLimits = [0, 250, 500, 750];
    uint256[] public mintPricing = [0.005 ether, 0.01 ether, 0.015 ether, 0.02 ether];

    enum MintStatus {
        CLOSED, // 0
        PUBLIC // 1
    }

    // mint pricing
    MintStatus public mintStatus = MintStatus.CLOSED;
    uint256 public maxTokensOwnableInWallet = 25;

    // flags
    bool public revealed = false;
    bool public morphEnabled = false;
    bool public boilEnabled = false;
    bool public soulbindEnabled = false;

    // character data
    mapping(uint256 => uint256) public seeds; 
    mapping(uint256 => bool) public soulbound; 
    mapping(uint256 => bool) public dead; 

    // contracts
    ITinyFrogRenderer public contractRenderer;

    // events
    event TinyFrogBoiled(uint256 indexed tokenId); // emitted when an TinyFrog gets boiled (burned)
    event TinyFrogMorphed(uint256 indexed tokenId); // emitted when an TinyFrog gets rerolled
    event TinyFrogSoulbound(uint256 indexed tokenId); // emitted when an TinyFrog gets soulbound
    event TinyFrogDied(uint256 indexed tokenId); // emitted when an TinyFrog dies

    // used by storefronts for locking/unlocking
    event TokenLocked(uint256 indexed tokenId, address indexed approvedContract);
    event Lock(address indexed unlocker, uint256 indexed id);
    //event TokenUnlocked(uint256 indexed tokenId, address indexed approvedContract);

    // error when trying to transfer soulbound token
    error TinyFrogIsSoulbound(uint256 tokenId);

    constructor() ERC721A("Tiny Based Frogs", "TINYFROG") {
        contractRenderer = ITinyFrogRenderer(this);
    }

    modifier verifyTokenId(uint256 tokenId) {
        require(tokenId >= _startTokenId() && tokenId <= _totalMinted(), "Invalid tokenId");
        _;
    }

    modifier onlyApprovedOrOwner(uint256 tokenId) {
        require(
            _ownershipOf(tokenId).addr == _msgSender() ||
                getApproved(tokenId) == _msgSender(),
            "Not approved nor owner"
        );
        
        _;
    }

    modifier verifySupply(uint256 numToMint) {
        require(numToMint > 0, "Mint at least 1");
        require(_totalMinted() + numToMint <= MAX_TOKEN_SUPPLY, "Overcap");

        _;
    }

    // randomize seed
    function _saveNewRandomSeed(uint256 tokenId) private {
        seeds[tokenId] = uint256(keccak256(abi.encodePacked(blockhash(block.number - 1), tokenId, msg.sender)));
    }

    /// @notice Boil a frog, make soup
    /// @param tokenId The tokenID for the frog
    function boilFrog(uint256 tokenId) external onlyApprovedOrOwner(tokenId) {
        require(boilEnabled == true);
        _burn(tokenId);
        dead[tokenId] = true;

        emit TinyFrogBoiled(tokenId);
        emit TinyFrogDied(tokenId);
    }

    function _startTokenId() override internal pure virtual returns (uint256) {
        return 1;
    }

    function _mintFrog(address to, uint256 numToMint) verifySupply(numToMint) private {
        uint256 startTokenId = _startTokenId() + _totalMinted();
        for(uint256 tokenId = startTokenId; tokenId < startTokenId+numToMint; tokenId++) {
            _saveNewRandomSeed(tokenId);
        }

         _safeMint(to, numToMint);
    }

    function reserveFrog(address to, uint256 numToMint) external onlyOwner {
        _mintFrog(to, numToMint);
    }

    function reserveFrogMany(address[] calldata recipients, uint256 numToMint) external onlyOwner {
        uint256 num = recipients.length;
        require(num > 0);

        for (uint256 i = 0; i < num; ++i) {
            _mintFrog(recipients[i], numToMint);    
        }
    }

    /// @notice Mint frogs
    /// @param numToMint The number of frogs to mint 
    function publicMintFrog(uint256 numToMint) external payable {
        require(mintStatus == MintStatus.PUBLIC, "Public mint closed");
        require(msg.value >= _getPrice(numToMint), "Incorrect payable" );

        // check max mint
        require(_numberMinted(msg.sender) + numToMint <= maxTokensOwnableInWallet, "Exceeds max mints");

        _mintFrog(msg.sender, numToMint);
    }

    // taken from 'ERC721AQueryable.sol'
    function tokensOfOwner(address owner) external view returns (uint256[] memory) {
        unchecked {
            uint256 tokenIdsIdx;
            address currOwnershipAddr;
            uint256 tokenIdsLength = balanceOf(owner);
            uint256[] memory tokenIds = new uint256[](tokenIdsLength);
            TokenOwnership memory ownership;
            for (uint256 i = _startTokenId(); tokenIdsIdx != tokenIdsLength; ++i) {
                ownership = _ownershipAt(i);
                if (ownership.burned) {
                    continue;
                }
                if (ownership.addr != address(0)) {
                    currOwnershipAddr = ownership.addr;
                }
                if (currOwnershipAddr == owner) {
                    tokenIds[tokenIdsIdx++] = i;
                }
            }
            return tokenIds;
        }
    }

    function _getPrice(uint256 numPayable) private view returns (uint256) {
        uint256 numMintedAlready = _totalMinted();
        uint tierIndex = 0;

        for(uint i = mintSupplyLimits.length-1; i >= 0; --i ) {
            if (numMintedAlready >= mintSupplyLimits[i]) {
                tierIndex = i;
                break;
            }
        }

        return numPayable * mintPricing[tierIndex];
    }

    ///////////////////////////
    // -- GETTERS/SETTERS --
    ///////////////////////////
    function getNumMinted() external view returns (uint256) {
        return _totalMinted();
    }

    function setPricing(uint256[] calldata supply, uint256[] calldata pricing) external onlyOwner {
        require(mintSupplyLimits.length == pricing.length);

        mintSupplyLimits = supply;
        mintPricing = pricing;
    }

    function setTokenMaxPerWallet(uint256 maxTokens) external onlyOwner {
        maxTokensOwnableInWallet = maxTokens;
    }

    function getPrice(uint256 numToMint) external view returns (uint256) {
        return _getPrice(numToMint);
    }

    function setMaxTokenSupply(uint256 _maxTokenSupply) external onlyOwner {
        MAX_TOKEN_SUPPLY = _maxTokenSupply;
    }

    function setMintStatus(uint256 _status) external onlyOwner {
        mintStatus = MintStatus(_status);
    }

    function setContractRenderer(address newAddress) external onlyOwner {
        contractRenderer = ITinyFrogRenderer(newAddress);
    }

    function setBoilEnabled(bool _enabled) external onlyOwner {
        boilEnabled = _enabled;
    }

    function setSoulbindEnabled(bool _enabled) external onlyOwner {
        soulbindEnabled = _enabled;
    }

    function setMorphEnabled(bool _enabled) external onlyOwner {
        morphEnabled = _enabled;
    }

    function numberMinted(address addr) external view returns(uint256){
        return _numberMinted(addr);
    }

    function setEnableReveal(bool _revealed) external onlyOwner {
        revealed = _revealed;

        // force metadata update
        emit BatchMetadataUpdate(1, _totalMinted());
    }

    ///////////////////////////
    // -- MORPH --
    ///////////////////////////
    function _morphFrog(uint256 tokenId) private {
        require(!dead[tokenId], "Already dead");
        require(!soulbound[tokenId], "Already soulbound");

        // roll dice to see if dead
        uint256 roll = uint256(keccak256(abi.encodePacked(blockhash(block.number - 1), tokenId, msg.sender, "ribbit")));

        // roll
        if (roll % 3 == 0) { // failed, now frog dies
            soulbound[tokenId] = true;
            dead[tokenId] = true;

            emit TinyFrogSoulbound(tokenId);
            emit TinyFrogDied(tokenId);

            // lock token (for storefronts not to sell)
            emit TokenLocked(tokenId, address(this));
            emit Lock(address(this), tokenId);
        } else { 
            // successfully morphed
            _saveNewRandomSeed(tokenId);
            emit TinyFrogMorphed(tokenId);
        }

        // force storefronts to refresh metadata
        emit MetadataUpdate(tokenId); 
    }

    /// @notice morph frogs, with a chance of dying (being soulbound)
    /// @param tokenIds Array of owned tokenIds of frogs to morph, use format [1,40,50]
    function morphMany(uint256[] calldata tokenIds) external {
        require(morphEnabled, "Morph disabled");

        uint256 num = tokenIds.length;
        for (uint256 i = 0; i < num; ++i) {
            uint256 tokenId = tokenIds[i];
            require(_ownershipOf(tokenId).addr == _msgSender(), "Must own");
            
            _morphFrog(tokenId);
        }
    }

    /// @notice morph a frog, with chance of dying (being soulbound)
    /// @param tokenId tokenId of frogs to morph
    function morphFrog(uint256 tokenId) external {
        require(morphEnabled, "Morph disabled");
        require(_ownershipOf(tokenId).addr == _msgSender(), "Must own");
        
        _morphFrog(tokenId);
    }

    ///////////////////////////
    // -- SOUL BINDING --
    ///////////////////////////

    // prevent token transfers on soulbound frogs
    function _beforeTokenTransfers(address from, address, uint256 startTokenId, uint256 quantity) internal view override {
        // allow for minting
        if (from == address(0))  
            return;

        for (uint256 tokenId = startTokenId; tokenId < startTokenId + quantity; ++tokenId) {
            // if soulbound do not allow transfers/burning
            if (soulbound[tokenId]) {
                revert TinyFrogIsSoulbound(tokenId);
            }
        }
    }

    function isDead(uint256 tokenId) external view verifyTokenId(tokenId) returns (bool) {
        return dead[tokenId];
    }

    function isSoulbound(uint256 tokenId) external view verifyTokenId(tokenId) returns (bool) {
        return soulbound[tokenId];
    }

    /// @notice permanently soulbind several frog
    /// @param tokenIds Array of owned tokenIds of frogs to soulbind, use format [1,40,50]
    function soulbindMany(uint256[] calldata tokenIds) external {
        require(soulbindEnabled);

        uint256 num = tokenIds.length;
        for (uint256 i = 0; i < num; ++i) {
            uint256 tokenId = tokenIds[i];
            require(_ownershipOf(tokenId).addr == _msgSender(), "Must own");
            
            _soulbindFrog(tokenId);
        }
    }

    /// @notice permanently soulbind frog
    /// @param tokenId tokenId of frogs to soulbind
    function soulbindFrog(uint256 tokenId) external {
        require(soulbindEnabled);
        require(_ownershipOf(tokenId).addr == _msgSender(), "Must own");
        
        _soulbindFrog(tokenId);
    }

    // soulbind single frog
    function _soulbindFrog(uint256 tokenId) private {
        require(!soulbound[tokenId], "Already soulbound");
        soulbound[tokenId] = true;

        emit TinyFrogSoulbound(tokenId);
        emit MetadataUpdate(tokenId); // force storefronts to refresh metadata
    }

    ///////////////////////////
    // -- TOKEN URI --
    ///////////////////////////
    function _tokenURI(uint256 tokenId) private view returns (string memory) {
        //string[13] memory lookup = [  '0', '1', '2', '3', '4', '5', '6', '7', '8','9', '10','11', '12'];
        uint256 seed = seeds[tokenId];

        bool isTokenDead = dead[tokenId];
        bool isTokenSoulbound = soulbound[tokenId];

        // get image
        string memory image = isTokenDead ? contractRenderer.getDeadSVG(seed) : contractRenderer.getSVG(seed, isTokenSoulbound);

        string memory json = Base64.encode(
            bytes(string(
                abi.encodePacked(
                    '{"name": ', '"Tiny Based Frog #', Strings.toString(tokenId),'",',
                    '"description": "Tiny Based Frogs is a 100% fully on-chain NFT collection, featuring unfathomly based on-chain interactive mechanics.",',
                    '"attributes":[',
                        contractRenderer.getTraitsMetadata(seed, isTokenSoulbound),
                        _getStatsMetadata(seed),
                        '{"trait_type":"Alive", "value":',isTokenDead ? '"No"' : '"Yes"','},',
                        '{"trait_type":"Soulbound", "value":',isTokenSoulbound ? '"Yes"' : '"No"','}'
                    '],',
                    '"image": "data:image/svg+xml;base64,', Base64.encode(bytes(image)), '"}' 
                )
            ))
        );

        return string(abi.encodePacked('data:application/json;base64,', json));
    }

    function _tokenUnrevealedURI(uint256 tokenId) private view returns (string memory) {
        uint256 seed = seeds[tokenId];
        string memory image = contractRenderer.getUnrevealedSVG(seed);

        string memory json = Base64.encode(
            bytes(string(
                abi.encodePacked(
                    '{"name": ', '"Tiny Based Frog #', Strings.toString(tokenId),'",',
                    '"description": "Tiny Based Frogs is a 100% fully on-chain NFT collection, featuring unfathomly based on-chain interactive mechanics.",',
                    '"attributes":[{"trait_type":"Waiting to hatch", "value":"True"}],',
                    '"image": "data:image/svg+xml;base64,', Base64.encode(bytes(image)), '"}' 
                )
            ))
        );

        return string(abi.encodePacked('data:application/json;base64,', json));
    }

    function tokenURI(uint256 tokenId) override(ERC721A) public view verifyTokenId(tokenId) returns (string memory) {
        if (revealed) 
            return _tokenURI(tokenId);
        else
            return _tokenUnrevealedURI(tokenId);
    }

    function _randStat(uint256 seed, uint256 div, uint256 min, uint256 max) private pure returns (uint256) {
        return min + (seed/div) % (max-min);
    }

    function _getStatsMetadata(uint256 seed) private pure returns (string memory) {
        //string[11] memory lookup = [ '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10' ];

        string memory metadata = string(abi.encodePacked(
          '{"trait_type":"Hop Power", "display_type": "number", "value":', Strings.toString(_randStat(seed, 2, 1, 5)), '},',
          '{"trait_type":"Stamina", "display_type": "number", "value":', Strings.toString(_randStat(seed, 3, 1, 10)), '},',
          '{"trait_type":"Lily Pad Balance", "display_type": "number", "value":', Strings.toString(_randStat(seed, 4, 1, 10)), '},',
          '{"trait_type":"Swim Speed", "display_type": "number", "value":', Strings.toString(_randStat(seed, 5, 1, 10)), '},'
        ));

        return metadata;
    }

    function withdraw(address to) public onlyOwner {
        uint256 contractBalance = address(this).balance;
        (bool success,) = payable(to).call{ value: contractBalance }("");
        require(success, "WITHDRAWAL_FAILED");
    }
}