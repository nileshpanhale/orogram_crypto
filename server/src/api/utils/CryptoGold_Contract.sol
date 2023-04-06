pragma solidity >= 0.4 .22 < 0.6 .0;


/**
 * @title Ownable
 * @dev The Ownable contract has an owner address, and provides basic authorization control
 * functions, this simplifies the implementation of "user permissions".
 */
contract Ownable {
    address private _owner;

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    /**
     * @dev The Ownable constructor sets the original `owner` of the contract to the sender
     * account.
     */
    constructor () internal {
        _owner = msg.sender;
        emit OwnershipTransferred(address(0), _owner);
    }

    /**
     * @return the address of the owner.
     */
    function owner() public view returns (address) {
        return _owner;
    }

    /**
     * @dev Throws if called by any account other than the owner.
     */
    modifier onlyOwner() {
        require(isOwner());
        _;
    }

    /**
     * @return true if `msg.sender` is the owner of the contract.
     */
    function isOwner() public view returns (bool) {
        return msg.sender == _owner;
    }

    /**
     * @dev Allows the current owner to relinquish control of the contract.
     * @notice Renouncing to ownership will leave the contract without an owner.
     * It will not be possible to call the functions with the `onlyOwner`
     * modifier anymore.
     */
    function renounceOwnership() public onlyOwner {
        emit OwnershipTransferred(_owner, address(0));
        _owner = address(0);
    }

    /**
     * @dev Allows the current owner to transfer control of the contract to a newOwner.
     * @param newOwner The address to transfer ownership to.
     */
    function transferOwnership(address newOwner) public onlyOwner {
        _transferOwnership(newOwner);
    }

    /**
     * @dev Transfers control of the contract to a newOwner.
     * @param newOwner The address to transfer ownership to.
     */
    function _transferOwnership(address newOwner) internal {
        require(newOwner != address(0));
        emit OwnershipTransferred(_owner, newOwner);
        _owner = newOwner;
    }
}

contract CryptoGold is Ownable {

    enum Action { NEW,CONFIRM,PENDING, PAID, CANCEL, DISPUTE, ACCEPT }


    struct TradeContract {
        address creator;
        address responder;
        bool creatorFirstSign;
        bool creatorSecondSign;
        bool responderSign;
        string contractText;
        uint256 contractValidity;
        Action status;
    }


    mapping(uint256 => TradeContract) tradeContracts;
    mapping(address => uint256[]) totalAcceptedTrades;
    mapping(address => uint256[]) totalCreatedTrades;
    uint256[] openTrades;


    function createContactRequest(uint256 generatedId, uint256 validity, string memory tradeMsg) public {
        TradeContract memory newTradeContract = TradeContract(msg.sender, address(0), true, false, false, tradeMsg, validity, Action.NEW);
        tradeContracts[generatedId] = newTradeContract;
        totalCreatedTrades[msg.sender].push(generatedId);
        openTrades.push(generatedId);
    }

    function responderSign(uint256 transactionId, bool _value) public returns (bool) {
        require(tradeContracts[transactionId].responderSign == false, "Already accepted");
        tradeContracts[transactionId].responderSign = _value;
        tradeContracts[transactionId].responder = msg.sender;
        totalAcceptedTrades[msg.sender].push(transactionId);
        delete openTrades[getIndex(transactionId)];
        return true;
    }

    function getIndex(uint256 transactionId) private view returns (uint256){
        uint256 index = 0;
         for (uint256 i = 0; i<openTrades.length-1; i++){
            if (openTrades[i] == transactionId){
                index = i;
                break;  
            }
        }
        return index;
    }

    function setPaid(uint256 transactionId) public {
        require(tradeContracts[transactionId].responder == msg.sender, "Invalid access");
        require(tradeContracts[transactionId].status == Action.NEW, "Invalid access");
        tradeContracts[transactionId].status = Action.PAID;
    }

    function setStatusByCreator(uint256 transactionId, Action actionStatus) public {
        require(tradeContracts[transactionId].creator == msg.sender, "Invalid access");
        require(actionStatus == Action.CANCEL && tradeContracts[transactionId].status == Action.NEW, "Can't cancel after accepted");
        require(actionStatus != Action.NEW || actionStatus != Action.PENDING);
        tradeContracts[transactionId].status = actionStatus;
    }

    function setStatusByAdmin(uint256 transactionId, Action actionStatus) public onlyOwner {
        tradeContracts[transactionId].status = actionStatus;
    }

    function totalAcceptedTrade() public view returns (uint256[] memory) {
        return totalAcceptedTrades[msg.sender];
    }

    function totalCreatedTrade() public view returns (uint256[] memory) {
        return totalCreatedTrades[msg.sender];
    }

    function creatorSecondSign(uint256 transactionId, bool _value) public returns (bool) {
        require(tradeContracts[transactionId].responderSign == true);
        require(tradeContracts[transactionId].responder != address(0));
        tradeContracts[transactionId].creatorSecondSign = _value;
        return true;
    }

    function getContract(uint256 transactionId) public view returns(address, address, bool, bool, bool, string memory, uint256, Action) {
        TradeContract memory t = tradeContracts[transactionId];
        return (t.creator, t.responder, t.creatorFirstSign, t.creatorSecondSign, t.responderSign, t.contractText, t.contractValidity, t.status);
    }

}