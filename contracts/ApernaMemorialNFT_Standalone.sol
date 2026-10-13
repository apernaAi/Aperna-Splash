// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ApernaMemorialNFT (Self-Contained Standalone Single-File Version for Remix IDE)
 * @notice Ready for 1-Click Deployment on Polygon Mainnet (Chain ID 137).
 * @dev Includes:
 *      1. Complete ERC-721 Standard (ownerOf, balanceOf, transferFrom, safeTransferFrom, approve, setApprovalForAll)
 *      2. Full ERC-721 Enumerable (totalSupply, tokenByIndex, tokenOfOwnerByIndex) for OpenSea compatibility
 *      3. EIP-2981 Secondary Sales Royalties (royaltyInfo)
 *      4. OpenSea Collection Metadata (contractURI)
 *      5. Secure Non-Reentrant Fund Withdrawal (withdraw, withdrawTo)
 */

interface IERC165 {
    function supportsInterface(bytes4 interfaceId) external view returns (bool);
}

interface IERC721 is IERC165 {
    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId);
    event ApprovalForAll(address indexed owner, address indexed operator, bool approved);

    function balanceOf(address owner) external view returns (uint256 balance);
    function ownerOf(uint256 tokenId) external view returns (address owner);
    function safeTransferFrom(address from, address to, uint256 tokenId, bytes calldata data) external;
    function safeTransferFrom(address from, address to, uint256 tokenId) external;
    function transferFrom(address from, address to, uint256 tokenId) external;
    function approve(address to, uint256 tokenId) external;
    function setApprovalForAll(address operator, bool approved) external;
    function getApproved(uint256 tokenId) external view returns (address operator);
    function isApprovedForAll(address owner, address operator) external view returns (bool);
}

interface IERC721Metadata is IERC721 {
    function name() external view returns (string memory);
    function symbol() external view returns (string memory);
    function tokenURI(uint256 tokenId) external view returns (string memory);
}

interface IERC721Enumerable is IERC721 {
    function totalSupply() external view returns (uint256);
    function tokenOfOwnerByIndex(address owner, uint256 index) external view returns (uint256);
    function tokenByIndex(uint256 index) external view returns (uint256);
}

interface IERC2981 is IERC165 {
    function royaltyInfo(uint256 tokenId, uint256 salePrice) external view returns (address receiver, uint256 royaltyAmount);
}

interface IERC721Receiver {
    function onERC721Received(address operator, address from, uint256 tokenId, bytes calldata data) external returns (bytes4);
}

contract ApernaMemorialNFT is IERC721Metadata, IERC721Enumerable, IERC2981 {
    string private _name = "Aperna AI Genesis Memorial Collection";
    string private _symbol = "APERNA-SAGA";
    string private _baseTokenURI = "https://aperna.ai/api/nft/real/metadata/";
    string private _contractURI = "https://aperna.ai/api/nft/real/collection-metadata.json";

    address public owner;
    address public royaltyReceiver;
    uint96 public royaltyFeeBps = 750; // 7.5% royalty

    uint256 public nextTokenId = 1;
    uint256 public constant MAX_SUPPLY = 2949;

    bool public paused = false;
    uint256 private _status = 1; // Reentrancy lock (1 = not entered, 2 = entered)

    // Chapter pricing in POL (MATIC) Wei
    mapping(uint8 => uint256) public chapterPrices;
    mapping(uint256 => uint8) public tokenChapter;

    // ERC721 ownership and approvals
    mapping(uint256 => address) private _owners;
    mapping(address => uint256) private _balances;
    mapping(uint256 => address) private _tokenApprovals;
    mapping(address => mapping(address => bool)) private _operatorApprovals;

    // Enumerable mappings for OpenSea
    uint256[] private _allTokens;
    mapping(uint256 => uint256) private _allTokensIndex;
    mapping(address => mapping(uint256 => uint256)) private _ownedTokens;
    mapping(uint256 => uint256) private _ownedTokensIndex;

    // Events
    event MintSuccess(address indexed minter, uint256 indexed tokenId, uint8 chapter, uint256 price);
    event FundsWithdrawn(address indexed recipient, uint256 amount);
    event RoyaltyUpdated(address indexed receiver, uint96 bps);
    event PriceUpdated(uint8 indexed chapter, uint256 newPrice);
    event PauseToggled(bool isPaused);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this");
        _;
    }

    modifier nonReentrant() {
        require(_status != 2, "ReentrancyGuard: reentrant call");
        _status = 2;
        _;
        _status = 1;
    }

    constructor() {
        owner = msg.sender;
        royaltyReceiver = msg.sender;

        // Initialize Chapter Mint Prices in Wei (POL / MATIC)
        chapterPrices[1] = 150 ether;  // 150 POL
        chapterPrices[2] = 300 ether;  // 300 POL
        chapterPrices[3] = 600 ether;  // 600 POL
        chapterPrices[4] = 1400 ether; // 1400 POL
    }

    // =========================================================================
    // ERC-721 METADATA
    // =========================================================================

    function name() external view override returns (string memory) {
        return _name;
    }

    function symbol() external view override returns (string memory) {
        return _symbol;
    }

    function tokenURI(uint256 tokenId) external view override returns (string memory) {
        require(_owners[tokenId] != address(0), "Token does not exist");
        uint8 chapter = tokenChapter[tokenId];
        return string(abi.encodePacked(_baseTokenURI, "chapter-", _toString(uint256(chapter))));
    }

    function contractURI() external view returns (string memory) {
        return _contractURI;
    }

    // =========================================================================
    // ERC-721 ENUMERABLE (OPENSEA COMPATIBILITY)
    // =========================================================================

    function totalSupply() public view override returns (uint256) {
        return _allTokens.length;
    }

    function tokenByIndex(uint256 index) external view override returns (uint256) {
        require(index < totalSupply(), "Index out of bounds");
        return _allTokens[index];
    }

    function tokenOfOwnerByIndex(address tokenOwner, uint256 index) external view override returns (uint256) {
        require(index < balanceOf(tokenOwner), "Owner index out of bounds");
        return _ownedTokens[tokenOwner][index];
    }

    function balanceOf(address account) public view override returns (uint256) {
        require(account != address(0), "Query for zero address");
        return _balances[account];
    }

    function ownerOf(uint256 tokenId) public view override returns (address) {
        address tokenOwner = _owners[tokenId];
        require(tokenOwner != address(0), "Token does not exist");
        return tokenOwner;
    }

    // =========================================================================
    // MINTING & AIRDROP
    // =========================================================================

    function mintChapter(uint8 chapter) external payable nonReentrant returns (uint256) {
        require(!paused, "Minting is paused");
        require(chapter >= 1 && chapter <= 4, "Invalid Chapter: Choose 1 to 4");
        require(nextTokenId <= MAX_SUPPLY, "Max supply of 2,949 reached. Sold out!");

        uint256 price = chapterPrices[chapter];
        require(msg.value >= price, "Insufficient POL sent for minting");

        uint256 tokenId = nextTokenId;
        nextTokenId++;

        tokenChapter[tokenId] = chapter;
        _mint(msg.sender, tokenId);

        emit MintSuccess(msg.sender, tokenId, chapter, price);

        // Refund excess POL
        if (msg.value > price) {
            uint256 excess = msg.value - price;
            (bool refundSuccess, ) = payable(msg.sender).call{value: excess}("");
            require(refundSuccess, "Refund failed");
        }

        return tokenId;
    }

    function airdrop(address to, uint8 chapter) external onlyOwner nonReentrant returns (uint256) {
        require(to != address(0), "Cannot mint to zero address");
        require(chapter >= 1 && chapter <= 4, "Invalid Chapter");
        require(nextTokenId <= MAX_SUPPLY, "Sold out");

        uint256 tokenId = nextTokenId;
        nextTokenId++;

        tokenChapter[tokenId] = chapter;
        _mint(to, tokenId);

        emit MintSuccess(to, tokenId, chapter, 0);
        return tokenId;
    }

    function batchAirdrop(address[] calldata recipients, uint8 chapter) external onlyOwner nonReentrant {
        require(chapter >= 1 && chapter <= 4, "Invalid Chapter");
        for (uint256 i = 0; i < recipients.length; i++) {
            require(nextTokenId <= MAX_SUPPLY, "Sold out");
            uint256 tokenId = nextTokenId;
            nextTokenId++;
            tokenChapter[tokenId] = chapter;
            _mint(recipients[i], tokenId);
            emit MintSuccess(recipients[i], tokenId, chapter, 0);
        }
    }

    // =========================================================================
    // SECURE OWNER WITHDRAWAL (FUNDS REVENUE PULL)
    // =========================================================================

    /**
     * @notice Safely withdraws all collected minting funds to the contract owner wallet.
     * @dev Resolves Bug #1: Funds will never be trapped.
     */
    function withdraw() external onlyOwner nonReentrant {
        uint256 balance = address(this).balance;
        require(balance > 0, "No POL balance available to withdraw");

        (bool success, ) = payable(owner).call{value: balance}("");
        require(success, "Withdrawal transfer failed");

        emit FundsWithdrawn(owner, balance);
    }

    /**
     * @notice Withdraws funds to a specific cold wallet or team vault.
     */
    function withdrawTo(address payable recipient) external onlyOwner nonReentrant {
        require(recipient != address(0), "Invalid recipient");
        uint256 balance = address(this).balance;
        require(balance > 0, "No POL balance available to withdraw");

        (bool success, ) = recipient.call{value: balance}("");
        require(success, "Withdrawal transfer failed");

        emit FundsWithdrawn(recipient, balance);
    }

    // =========================================================================
    // EIP-2981 ROYALTIES (OPENSEA & MAGIC EDEN)
    // =========================================================================

    function royaltyInfo(uint256, uint256 salePrice) external view override returns (address receiver, uint256 royaltyAmount) {
        return (royaltyReceiver, (salePrice * royaltyFeeBps) / 10000);
    }

    function setRoyalty(address receiver, uint96 bps) external onlyOwner {
        royaltyReceiver = receiver;
        royaltyFeeBps = bps;
        emit RoyaltyUpdated(receiver, bps);
    }

    function setBaseURI(string memory newBase) external onlyOwner {
        _baseTokenURI = newBase;
    }

    function setContractURI(string memory newContractURI) external onlyOwner {
        _contractURI = newContractURI;
    }

    function setChapterPrice(uint8 chapter, uint256 price) external onlyOwner {
        require(chapter >= 1 && chapter <= 4, "Invalid Chapter");
        chapterPrices[chapter] = price;
        emit PriceUpdated(chapter, price);
    }

    function togglePause() external onlyOwner {
        paused = !paused;
        emit PauseToggled(paused);
    }

    // =========================================================================
    // ERC-721 INTERNAL TRANSFERS & APPROVALS
    // =========================================================================

    function approve(address to, uint256 tokenId) public override {
        address tokenOwner = ownerOf(tokenId);
        require(to != tokenOwner, "Approval to current owner");
        require(msg.sender == tokenOwner || isApprovedForAll(tokenOwner, msg.sender), "Not authorized");
        _tokenApprovals[tokenId] = to;
        emit Approval(tokenOwner, to, tokenId);
    }

    function getApproved(uint256 tokenId) public view override returns (address) {
        require(_owners[tokenId] != address(0), "Token query for nonexistent token");
        return _tokenApprovals[tokenId];
    }

    function setApprovalForAll(address operator, bool approved) public override {
        require(operator != msg.sender, "Approve to caller");
        _operatorApprovals[msg.sender][operator] = approved;
        emit ApprovalForAll(msg.sender, operator, approved);
    }

    function isApprovedForAll(address tokenOwner, address operator) public view override returns (bool) {
        return _operatorApprovals[tokenOwner][operator];
    }

    function transferFrom(address from, address to, uint256 tokenId) public override {
        require(_isApprovedOrOwner(msg.sender, tokenId), "Transfer not authorized");
        _transfer(from, to, tokenId);
    }

    function safeTransferFrom(address from, address to, uint256 tokenId) public override {
        safeTransferFrom(from, to, tokenId, "");
    }

    function safeTransferFrom(address from, address to, uint256 tokenId, bytes memory data) public override {
        require(_isApprovedOrOwner(msg.sender, tokenId), "Transfer not authorized");
        _transfer(from, to, tokenId);
        require(_checkOnERC721Received(from, to, tokenId, data), "Transfer to non ERC721Receiver implementer");
    }

    function _mint(address to, uint256 tokenId) internal {
        require(to != address(0), "Mint to zero address");

        _balances[to] += 1;
        _owners[tokenId] = to;

        // Enumerable index tracking
        _ownedTokensIndex[tokenId] = _balances[to] - 1;
        _ownedTokens[to][_balances[to] - 1] = tokenId;

        _allTokensIndex[tokenId] = _allTokens.length;
        _allTokens.push(tokenId);

        emit Transfer(address(0), to, tokenId);
        require(_checkOnERC721Received(address(0), to, tokenId, ""), "Transfer to non ERC721Receiver implementer");
    }

    function _transfer(address from, address to, uint256 tokenId) internal {
        require(ownerOf(tokenId) == from, "Transfer from incorrect owner");
        require(to != address(0), "Transfer to zero address");

        delete _tokenApprovals[tokenId];

        // Update owner enumerable indexing
        uint256 lastTokenIndex = _balances[from] - 1;
        uint256 tokenIndex = _ownedTokensIndex[tokenId];
        if (tokenIndex != lastTokenIndex) {
            uint256 lastTokenId = _ownedTokens[from][lastTokenIndex];
            _ownedTokens[from][tokenIndex] = lastTokenId;
            _ownedTokensIndex[lastTokenId] = tokenIndex;
        }
        delete _ownedTokensIndex[tokenId];
        delete _ownedTokens[from][lastTokenIndex];

        _balances[from] -= 1;
        _balances[to] += 1;
        _owners[tokenId] = to;

        _ownedTokensIndex[tokenId] = _balances[to] - 1;
        _ownedTokens[to][_balances[to] - 1] = tokenId;

        emit Transfer(from, to, tokenId);
    }

    function _isApprovedOrOwner(address spender, uint256 tokenId) internal view returns (bool) {
        address tokenOwner = ownerOf(tokenId);
        return (spender == tokenOwner || isApprovedForAll(tokenOwner, spender) || getApproved(tokenId) == spender);
    }

    function _checkOnERC721Received(address from, address to, uint256 tokenId, bytes memory data) private returns (bool) {
        if (to.code.length > 0) {
            try IERC721Receiver(to).onERC721Received(msg.sender, from, tokenId, data) returns (bytes4 retval) {
                return retval == IERC721Receiver.onERC721Received.selector;
            } catch {
                return false;
            }
        }
        return true;
    }

    function supportsInterface(bytes4 interfaceId) public pure override returns (bool) {
        return interfaceId == type(IERC721).interfaceId ||
               interfaceId == type(IERC721Metadata).interfaceId ||
               interfaceId == type(IERC721Enumerable).interfaceId ||
               interfaceId == type(IERC2981).interfaceId ||
               interfaceId == type(IERC165).interfaceId;
    }

    function _toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) return "0";
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }
}
