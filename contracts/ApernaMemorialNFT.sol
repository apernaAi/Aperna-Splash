// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title ApernaMemorialNFT
 * @notice Complete Production ERC-721 Smart Contract for Aperna AI Genesis Memorial Saga
 * @dev Fully compliant with Polygon PoS Mainnet (Chain ID 137), OpenSea, Magic Eden, Rarible,
 *      and EIP-2981 Royalty Standard. Includes full enumeration, owner verification,
 *      contractURI for OpenSea collection storefront, and secure non-reentrant fund withdrawal.
 */
contract ApernaMemorialNFT is ERC721Enumerable, Ownable, ReentrancyGuard, ERC2981 {
    using Strings for uint256;

    // Collection Configuration
    string private _baseTokenURI;
    string private _contractMetadataURI;
    
    uint256 public nextTokenId = 1;
    uint256 public constant MAX_SUPPLY = 2949; // 999 Ch1 + 750 Ch2 + 500 Ch3 + 700 Ch4

    // Chapter Pricing in Wei (Polygon POL / MATIC)
    // Ch1: 150 POL (~$60 USD)
    // Ch2: 300 POL (~$120 USD)
    // Ch3: 600 POL (~$240 USD)
    // Ch4: 1400 POL (~$560 USD)
    mapping(uint8 => uint256) public chapterPrices;
    mapping(uint256 => uint8) public tokenChapter;

    // Operational Controls
    bool public paused = false;

    // Events
    event MintSuccess(address indexed minter, uint256 indexed tokenId, uint8 chapter, uint256 price);
    event FundsWithdrawn(address indexed recipient, uint256 amount);
    event BaseURIUpdated(string newBaseURI);
    event ContractURIUpdated(string newContractURI);
    event ChapterPriceUpdated(uint8 indexed chapter, uint256 newPrice);
    event PauseToggled(bool isPaused);

    constructor() 
        ERC721("Aperna AI Genesis Memorial Collection", "APERNA-SAGA") 
        Ownable(msg.sender) 
    {
        // Default IPFS / API Metadata URIs
        _baseTokenURI = "https://aperna.ai/api/nft/real/metadata/";
        _contractMetadataURI = "https://aperna.ai/api/nft/real/collection-metadata.json";

        // Default 7.5% Royalty to Contract Deployer (OpenSea, Magic Eden, Blur)
        _setDefaultRoyalty(msg.sender, 750); // 750 basis points = 7.5%

        // Initialize Chapter Mint Prices in Wei (POL / MATIC)
        chapterPrices[1] = 150 ether;  // 150 POL
        chapterPrices[2] = 300 ether;  // 300 POL
        chapterPrices[3] = 600 ether;  // 600 POL
        chapterPrices[4] = 1400 ether; // 1400 POL
    }

    // =========================================================================
    // MINTING FUNCTIONS (PUBLIC & ADMIN)
    // =========================================================================

    /**
     * @notice Public mint function to mint a specific Chapter NFT on Polygon
     * @param chapter Chapter number (1 = The Spark, 2 = Deploy Void, 3 = Acoustic Trial, 4 = Golden Victory)
     */
    function mintChapter(uint8 chapter) external payable nonReentrant returns (uint256) {
        require(!paused, "Minting is currently paused");
        require(chapter >= 1 && chapter <= 4, "Invalid Chapter: Choose 1 to 4");
        require(nextTokenId <= MAX_SUPPLY, "Max supply of 2,949 reached. Sold out!");

        uint256 requiredPrice = chapterPrices[chapter];
        require(msg.value >= requiredPrice, "Insufficient POL sent for minting");

        uint256 tokenId = nextTokenId;
        nextTokenId++;

        tokenChapter[tokenId] = chapter;
        _safeMint(msg.sender, tokenId);

        emit MintSuccess(msg.sender, tokenId, chapter, requiredPrice);

        // Refund any excess POL sent by the buyer
        if (msg.value > requiredPrice) {
            uint256 excess = msg.value - requiredPrice;
            (bool refundSuccess, ) = payable(msg.sender).call{value: excess}("");
            require(refundSuccess, "Excess POL refund failed");
        }

        return tokenId;
    }

    /**
     * @notice Free community airdrop / admin claim for marketing & verified referral winners
     * @param recipient Destination wallet address
     * @param chapter Chapter number (1 to 4)
     */
    function airdrop(address recipient, uint8 chapter) external onlyOwner nonReentrant returns (uint256) {
        require(recipient != address(0), "Cannot mint to zero address");
        require(chapter >= 1 && chapter <= 4, "Invalid Chapter: Choose 1 to 4");
        require(nextTokenId <= MAX_SUPPLY, "Sold out");

        uint256 tokenId = nextTokenId;
        nextTokenId++;

        tokenChapter[tokenId] = chapter;
        _safeMint(recipient, tokenId);

        emit MintSuccess(recipient, tokenId, chapter, 0);
        return tokenId;
    }

    /**
     * @notice Batch airdrop for community rewards
     */
    function batchAirdrop(address[] calldata recipients, uint8 chapter) external onlyOwner nonReentrant {
        require(chapter >= 1 && chapter <= 4, "Invalid Chapter");
        for (uint256 i = 0; i < recipients.length; i++) {
            require(nextTokenId <= MAX_SUPPLY, "Sold out");
            uint256 tokenId = nextTokenId;
            nextTokenId++;
            tokenChapter[tokenId] = chapter;
            _safeMint(recipients[i], tokenId);
            emit MintSuccess(recipients[i], tokenId, chapter, 0);
        }
    }

    // =========================================================================
    // WITHDRAWAL (SECURE OWNER REVENUE PULL)
    // =========================================================================

    /**
     * @notice Pull all collected mint funds (POL / MATIC) directly to the contract owner wallet.
     * @dev Uses nonReentrant and call{value} with success check to prevent trapped funds.
     */
    function withdraw() external onlyOwner nonReentrant {
        uint256 contractBalance = address(this).balance;
        require(contractBalance > 0, "No POL balance available in contract");

        address contractOwner = owner();
        (bool success, ) = payable(contractOwner).call{value: contractBalance}("");
        require(success, "Withdrawal transfer failed");

        emit FundsWithdrawn(contractOwner, contractBalance);
    }

    /**
     * @notice Withdraw funds to a designated cold wallet or vault address
     * @param recipient Address to receive the POL funds
     */
    function withdrawTo(address payable recipient) external onlyOwner nonReentrant {
        require(recipient != address(0), "Invalid recipient address");
        uint256 contractBalance = address(this).balance;
        require(contractBalance > 0, "No POL balance available in contract");

        (bool success, ) = recipient.call{value: contractBalance}("");
        require(success, "Withdrawal transfer failed");

        emit FundsWithdrawn(recipient, contractBalance);
    }

    // =========================================================================
    // METADATA & OPENSEA CONFIGURATION
    // =========================================================================

    /**
     * @notice Returns the metadata URI for a given token ID
     * @dev OpenSea / Magic Eden call this to render image, video, traits, and story.
     */
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        uint8 chapter = tokenChapter[tokenId];
        return string(abi.encodePacked(_baseTokenURI, "chapter-", uint256(chapter).toString()));
    }

    /**
     * @notice OpenSea collection storefront metadata URI
     * @dev Returns collection name, description, cover image, banner, and external link.
     */
    function contractURI() public view returns (string memory) {
        return _contractMetadataURI;
    }

    function setBaseURI(string memory newBaseURI) external onlyOwner {
        _baseTokenURI = newBaseURI;
        emit BaseURIUpdated(newBaseURI);
    }

    function setContractURI(string memory newContractURI) external onlyOwner {
        _contractMetadataURI = newContractURI;
        emit ContractURIUpdated(newContractURI);
    }

    // =========================================================================
    // ROYALTY CONFIGURATION (EIP-2981 FOR OPENSEA / MAGIC EDEN)
    // =========================================================================

    /**
     * @notice Update default royalty receiver and percentage
     * @param receiver Wallet address to receive secondary royalties
     * @param feeNumerator Royalty in basis points (e.g., 750 = 7.5%, 500 = 5%)
     */
    function setDefaultRoyalty(address receiver, uint96 feeNumerator) external onlyOwner {
        _setDefaultRoyalty(receiver, feeNumerator);
    }

    // =========================================================================
    // PRICING & PAUSE CONTROLS
    // =========================================================================

    function setChapterPrice(uint8 chapter, uint256 newPriceInWei) external onlyOwner {
        require(chapter >= 1 && chapter <= 4, "Invalid Chapter: Choose 1 to 4");
        chapterPrices[chapter] = newPriceInWei;
        emit ChapterPriceUpdated(chapter, newPriceInWei);
    }

    function togglePause() external onlyOwner {
        paused = !paused;
        emit PauseToggled(paused);
    }

    // =========================================================================
    // SOLIDITY INHERITANCE OVERRIDES
    // =========================================================================

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721Enumerable, ERC2981)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
