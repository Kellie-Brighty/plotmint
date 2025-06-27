/ SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

// ---- IERC20.sol ----

interface IERC20 {
event Transfer(address indexed from, address indexed to, uint256 value);
event Approval(address indexed owner, address indexed spender, uint256 value);
function totalSupply() external view returns (uint256);
function balanceOf(address account) external view returns (uint256);
function transfer(address to, uint256 value) external returns (bool);
function allowance(address owner, address spender) external view returns (uint256);
function approve(address spender, uint256 value) external returns (bool);
function transferFrom(address from, address to, uint256 value) external returns (bool);
}

// ---- IERC20Metadata.sol ----

interface IERC20Metadata is IERC20 {
function name() external view returns (string memory);
function symbol() external view returns (string memory);
function decimals() external view returns (uint8);
}

// ---- draft-IERC6093.sol ----
interface IERC20Errors {
error ERC20InsufficientBalance(address sender, uint256 balance, uint256 needed);
error ERC20InvalidSender(address sender);
error ERC20InvalidReceiver(address receiver);
error ERC20InsufficientAllowance(address spender, uint256 allowance, uint256 needed);
error ERC20InvalidApprover(address approver);
error ERC20InvalidSpender(address spender);
}

interface IERC721Errors {
error ERC721InvalidOwner(address owner);
error ERC721NonexistentToken(uint256 tokenId);
error ERC721IncorrectOwner(address sender, uint256 tokenId, address owner);
error ERC721InvalidSender(address sender);
error ERC721InvalidReceiver(address receiver);
error ERC721InsufficientApproval(address operator, uint256 tokenId);
error ERC721InvalidApprover(address approver);
error ERC721InvalidOperator(address operator);
}

interface IERC1155Errors {
error ERC1155InsufficientBalance(address sender, uint256 balance, uint256 needed, uint256 tokenId);
error ERC1155InvalidSender(address sender);
error ERC1155InvalidReceiver(address receiver);
error ERC1155MissingApprovalForAll(address operator, address owner);
error ERC1155InvalidApprover(address approver);
error ERC1155InvalidOperator(address operator);
error ERC1155InvalidArrayLength(uint256 idsLength, uint256 valuesLength);
}

// ---- Context.sol ----
abstract contract Context {
function \_msgSender() internal view virtual returns (address) {
return msg.sender;
}

    function _msgData() internal view virtual returns (bytes calldata) {
        return msg.data;
    }

    function _contextSuffixLength() internal view virtual returns (uint256) {
        return 0;
    }

}

// ---- ERC20.sol ----
abstract contract ERC20 is Context, IERC20, IERC20Metadata, IERC20Errors {
mapping(address account => uint256) private \_balances;
mapping(address account => mapping(address spender => uint256)) private \_allowances;
uint256 private \_totalSupply;
string private \_name;
string private \_symbol;

    constructor(string memory name_, string memory symbol_) {
        _name = name_;
        _symbol = symbol_;
    }

    function name() public view virtual returns (string memory) {
        return _name;
    }

    function symbol() public view virtual returns (string memory) {
        return _symbol;
    }

    function decimals() public view virtual returns (uint8) {
        return 18;
    }

    function totalSupply() public view virtual returns (uint256) {
        return _totalSupply;
    }

    function balanceOf(address account) public view virtual returns (uint256) {
        return _balances[account];
    }

    function transfer(address to, uint256 value) public virtual returns (bool) {
        address owner = _msgSender();
        _transfer(owner, to, value);
        return true;
    }

    function allowance(address owner, address spender) public view virtual returns (uint256) {
        return _allowances[owner][spender];
    }
function approve(address spender, uint256 value) public virtual returns (bool) {
        address owner = _msgSender();
        _approve(owner, spender, value);
        return true;
    }

    function transferFrom(address from, address to, uint256 value) public virtual returns (bool) {
        address spender = _msgSender();
        _spendAllowance(from, spender, value);
        _transfer(from, to, value);
        return true;
    }

    function _transfer(address from, address to, uint256 value) internal {
        if (from == address(0)) {
            revert ERC20InvalidSender(address(0));
        }
        if (to == address(0)) {
            revert ERC20InvalidReceiver(address(0));
        }
        _update(from, to, value);
    }

    function _update(address from, address to, uint256 value) internal virtual {
        if (from == address(0)) {
            _totalSupply += value;
        } else {
            uint256 fromBalance = _balances[from];
            if (fromBalance < value) {
                revert ERC20InsufficientBalance(from, fromBalance, value);
            }
            unchecked {
                _balances[from] = fromBalance - value;
            }
        }

        if (to == address(0)) {
            unchecked {
                _totalSupply -= value;
            }
        } else {
            unchecked {
                _balances[to] += value;
            }
        }

        emit Transfer(from, to, value);
    }

    function _mint(address account, uint256 value) internal {
        if (account == address(0)) {
            revert ERC20InvalidReceiver(address(0));
        }
        _update(address(0), account, value);
    }

    function _burn(address account, uint256 value) internal {
        if (account == address(0)) {
            revert ERC20InvalidSender(address(0));
        }
        _update(account, address(0), value);
    }

    function _approve(address owner, address spender, uint256 value) internal {
        _approve(owner, spender, value, true);
    }

    function _approve(address owner, address spender, uint256 value, bool emitEvent) internal virtual {
        if (owner == address(0)) {
            revert ERC20InvalidApprover(address(0));
        }
        if (spender == address(0)) {
            revert ERC20InvalidSpender(address(0));
        }
        _allowances[owner][spender] = value;
        if (emitEvent) {
            emit Approval(owner, spender, value);
        }
    }

    function _spendAllowance(address owner, address spender, uint256 value) internal virtual {
        uint256 currentAllowance = allowance(owner, spender);
        if (currentAllowance < type(uint256).max) {
            if (currentAllowance < value) {
                revert ERC20InsufficientAllowance(spender, currentAllowance, value);
            }
            unchecked {
                _approve(owner, spender, currentAllowance - value, false);
            }
        }
    }
}

// ---- ERC20Burnable.sol ----
abstract contract ERC20Burnable is Context, ERC20 {
    function burn(uint256 value) public virtual {
        _burn(_msgSender(), value);
    }

    function burnFrom(address account, uint256 value) public virtual {
        _spendAllowance(account, _msgSender(), value);
        _burn(account, value);
    }
}

// ---- Token.sol ----
contract Token is ERC20, ERC20Burnable {
    address public platform;
    address public creator;

    constructor(
        string memory _name,
        string memory _symbol,
        address _creator,
        address _platform
    ) ERC20(_name, _symbol) {
        platform = _platform;
        creator = _creator;
        _mint(_platform, 1000000000 * 10 ** decimals());
    }
}

// ---- Factory.sol Interfaces ----
interface IToken {
    function creator() external view returns (address);
}

interface IWETH {
    function withdraw(uint256 amount) external;
}

interface IUniswapV3Factory {
    function getPool(address tokenA, address tokenB, uint24 fee) external view returns (address);
}
interface ISwapRouter02 {
    struct ExactInputSingleParams {
        address tokenIn;
        address tokenOut;
        uint24 fee;
        address recipient;
        uint256 amountIn;
        uint256 amountOutMinimum;
        uint160 sqrtPriceLimitX96;
    }

    function exactInputSingle(ExactInputSingleParams calldata params)
        external
        payable
        returns (uint256 amountOut);
}

interface INonfungiblePositionManager {
    struct MintParams {
        address token0;
        address token1;
        uint24 fee;
        int24 tickLower;
        int24 tickUpper;
        uint256 amount0Desired;
        uint256 amount1Desired;
        uint256 amount0Min;
        uint256 amount1Min;
        address recipient;
        uint256 deadline;
    }

    function factory() external view returns (address);
    function WETH9() external view returns (address);

    function positions(uint256 tokenId) external view returns (
        uint96 nonce,
        address operator,
        address token0,
        address token1,
        uint24 fee,
        int24 tickLower,
        int24 tickUpper,
        uint128 liquidity,
        uint256 feeGrowthInside0LastX128,
        uint256 feeGrowthInside1LastX128,
        uint128 tokensOwed0,
        uint128 tokensOwed1
    );

    function createAndInitializePoolIfNecessary(
        address token0,
        address token1,
        uint24 fee,
        uint160 sqrtPriceX96
    ) external returns (address pool);

    function mint(MintParams calldata params) external returns (
        uint256 tokenId,
        uint128 liquidity,
        uint256 amount0,
        uint256 amount1
    );

    struct CollectParams {
        uint256 tokenId;
        address recipient;
        uint128 amount0Max;
        uint128 amount1Max;
    }

    function collect(CollectParams calldata params) external payable returns (
        uint256 amount0,
        uint256 amount1
    );

    function getApproved(uint256 tokenId) external view returns (address);
    function isApprovedForAll(address owner, address operator) external view returns (bool);
    function ownerOf(uint256 tokenId) external view returns (address);
}

// ---- Factory.sol ----
contract Factory {
    event ERC20TokenCreated(address tokenAddress);

    struct TokenInfo {
        address tokenAddress;
        string name;
        string symbol;
        address deployer;
        uint256 time;
        string metadata;
        uint256 marketCapInETH;
    }

    mapping(uint256 => TokenInfo) public deployedTokens;
    uint256 public tokenCount = 0;
    address public platformController;

    address public constant POSITION_MANAGER = 0xC36442b4a4522E871399CD717aBDD847Ab11FE88;
    uint256 constant Q96 = 2 ** 96;
    address public constant WETH = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;
    address public constant SWAP_ROUTER = 0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45;

    uint24 private constant FEE_TIER = 10000;
    uint256 private constant VIRTUAL_ETH = 1.5 ether;

    event TokenPurchased(address buyer, address tokenOut, uint256 ethSpent, uint256 tokensReceived);

    constructor() {
        platformController = msg.sender;
    }

    receive() external payable {}

    function deployCoin(string memory _name, string memory _symbol, string memory _metadata) public payable {
        Token t = new Token(_name, _symbol, msg.sender, address(this));
        emit ERC20TokenCreated(address(t));

        address coinAddress = address(t);
        provideLiquidity(coinAddress, WETH);

        if (msg.value > 0) {
            ISwapRouter02(SWAP_ROUTER).exactInputSingle{ value: msg.value }(
                ISwapRouter02.ExactInputSingleParams({
                    tokenIn: WETH,
                    tokenOut: coinAddress,
                    fee: 10000,
                    recipient: msg.sender,
                    amountIn: msg.value,
                    amountOutMinimum: 0,
                    sqrtPriceLimitX96: 0
                })
            );
        }
        deployedTokens[tokenCount] = TokenInfo({
            tokenAddress: coinAddress,
            name: _name,
            symbol: _symbol,
            deployer: msg.sender,
            time: block.timestamp,
            metadata: _metadata,
            marketCapInETH: 0
        });
        tokenCount++;
    }

    function getDeploysByPage(uint256 page, uint256 order) public view returns (TokenInfo[] memory) {
        uint256 itemsPerPage = 50;
        require(tokenCount > 0, "No tokens deployed");

        uint256 totalPages = (tokenCount + itemsPerPage - 1) / itemsPerPage;
        require(page < totalPages, "Page out of range");

        uint256 start;
        uint256 end;
        uint256 j = 0;

        if (order == 0) {
            start = tokenCount > (page + 1) * itemsPerPage ? tokenCount - (page + 1) * itemsPerPage : 0;
            end = tokenCount - page * itemsPerPage;
            if (end > tokenCount) end = tokenCount;
        } else {
            start = page * itemsPerPage;
            end = start + itemsPerPage;
            if (end > tokenCount) end = tokenCount;
        }

        TokenInfo[] memory tokens = new TokenInfo[](end - start);
        address weth = INonfungiblePositionManager(POSITION_MANAGER).WETH9();
        address factory = INonfungiblePositionManager(POSITION_MANAGER).factory();

        for (uint256 i = start; i < end; i++) {
            uint256 index = order == 0 ? end - 1 - (i - start) : i;
            TokenInfo memory info = deployedTokens[index];

            uint256 marketCap = 0;
            address pool = IUniswapV3Factory(factory).getPool(info.tokenAddress, weth, 10000);
            if (pool != address(0)) {
                uint256 wethInPool = IERC20(weth).balanceOf(pool);
                uint256 tokenInPool = IERC20(info.tokenAddress).balanceOf(pool);
                uint256 totalSupply = IERC20(info.tokenAddress).totalSupply();

                if (tokenInPool > 0) {
                    marketCap = ((wethInPool + 1.5 ether) * totalSupply) / tokenInPool;
                }
            }

            tokens[j++] = TokenInfo({
                tokenAddress: info.tokenAddress,
                name: info.name,
                symbol: info.symbol,
                deployer: info.deployer,
                time: info.time,
                metadata: info.metadata,
                marketCapInETH: marketCap
            });
        }

        return tokens;
    }

    function withdrawFees() external {
        require(msg.sender == platformController, "Caller is not controller");
        uint256 wethBalance = IERC20(WETH).balanceOf(address(this));
        require(wethBalance > 0, "No WETH to withdraw");

        IWETH(WETH).withdraw(wethBalance);
        (bool success, ) = msg.sender.call{ value: wethBalance }("");
        require(success, "ETH transfer failed");
    }

    function uint2str(uint256 _i) internal pure returns (string memory) {
        if (_i == 0) return "0";
        uint256 j = _i;
        uint256 length;
        while (j != 0) {
            length++;
            j /= 10;
        }
        bytes memory bstr = new bytes(length);
        uint256 k = length;
        j = _i;
        while (j != 0) {
            bstr[--k] = bytes1(uint8(48 + j % 10));
            j /= 10;
        }
        return string(bstr);
    }

    function provideLiquidity(address tokenA, address tokenB) public {
        bool tokenAIsToken0 = tokenA < tokenB;
        address token0 = tokenAIsToken0 ? tokenA : tokenB;
        address token1 = tokenAIsToken0 ? tokenB : tokenA;

        IERC20(token0).approve(POSITION_MANAGER, type(uint256).max);
        IERC20(token1).approve(POSITION_MANAGER, type(uint256).max);

        INonfungiblePositionManager manager = INonfungiblePositionManager(POSITION_MANAGER);

        uint160 sqrtPriceX96 = tokenAIsToken0
            ? 3068365595550320841079178
            : 2045645379722529521098596513701367;

        int24 tickLower = tokenAIsToken0 ? int24(-203000) : int24(-887200);
        int24 tickUpper = tokenAIsToken0 ? int24(887200) : int24(203000);
        uint256 amount0Desired = tokenAIsToken0 ? 1000000000000000000000000000 : 0;
        uint256 amount1Desired = tokenAIsToken0 ? 0 : 1000000000000000000000000000;

        manager.createAndInitializePoolIfNecessary(token0, token1, 10000, sqrtPriceX96);

        manager.mint(
            INonfungiblePositionManager.MintParams({
                token0: token0,
                token1: token1,
                fee: 10000,
                tickLower: tickLower,
                tickUpper: tickUpper,
                amount0Desired: amount0Desired,
                amount1Desired: amount1Desired,
                amount0Min: 0,
                amount1Min: 0,
                recipient: address(this),
                deadline: block.timestamp
            })
        );
    }

    function collectFees(uint256 tokenId) external returns (uint256 amount0, uint256 amount1) {
        (, , address token0Raw, address token1Raw, , , , , , , , ) =
            INonfungiblePositionManager(POSITION_MANAGER).positions(tokenId);

        address token0 = token0Raw;
        address token1 = token1Raw;

        if (token0Raw == WETH && token1Raw != WETH) {
            token0 = token1Raw;
            token1 = token1Raw;
        }

        require(IToken(token0).creator() == msg.sender, "Caller must be creator");

        uint256 beforeToken0 = IERC20(token0).balanceOf(address(this));
        uint256 beforeToken1 = IERC20(token1).balanceOf(address(this));

        INonfungiblePositionManager.CollectParams memory params = INonfungiblePositionManager.CollectParams({
            tokenId: tokenId,
            recipient: address(this),
            amount0Max: type(uint128).max,
            amount1Max: type(uint128).max
        });

        INonfungiblePositionManager(POSITION_MANAGER).collect(params);

        uint256 collected0 = IERC20(token0).balanceOf(address(this)) - beforeToken0;
        uint256 collected1 = IERC20(token1).balanceOf(address(this)) - beforeToken1;

        if (collected0 > 0) {
            IERC20(token0).transfer(msg.sender, collected0);
        }
        if (collected1 > 0) {
            IERC20(token1).transfer(msg.sender, collected1 / 2);
        }

        return (collected0, collected1);
    }

    function getToken0Address(uint256 tokenId) public view returns (address token0) {
        ( , , token0, , , , , , , , , ) =
            INonfungiblePositionManager(POSITION_MANAGER).positions(tokenId);
    }
}