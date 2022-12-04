pragma solidity >=0.7.0 <=0.8.9;
// SPDX-License-Identifier: MIT

import './EVBToken.sol';

contract evBatteryMarketPlace {

    //data declarations
    //enum for batteryStage
    struct Battery {
        uint batteryStage; // is it with the manufacturer(0), in the ecosystem(1) or dead(2)
        uint batteryLife; //Remaining battery life
        bool batteryStatus; // is it dead or alive: Bool
        uint counter; // how many times has it been exchanged
        address currentHolder; //address of the current holder
    }

    struct Entity {
        uint entityType; //Organisation(0) /Dealer(1) /User(2)
        uint chargedBatteries; //holding number of charged batteries
        uint drainedBatteries; //holding number of drained batteries
    }

    address public President;
    mapping(address => Entity) public entity;
    mapping(address => Battery) public battery;

    constructor() {
        President = msg.sender;
    }

    //modifiers
    //to check if battery is dead
    modifier isBatteryDead(address bat_add){
        require ( battery[bat_add].batteryStatus == true, "battery status is not true");
        _;
    }

    //to check if the transacting address is the president
    modifier onlyPresident (){
        require(msg.sender == President, " only president has the execution rights");
        _;
    }

    //to check that the battery is in the correct stage
    modifier batteryCorrectStage (address bat_add, uint stage){
        require(battery[bat_add].batteryStage == stage, "battery stage is not correct");
        _;
    }

    //to check that the transacting entity is also the curent batttery holder
    modifier batteryCurrentHolder (address bat_add, address currentholder){
        require(battery[bat_add].currentHolder == currentholder, "battery current holder doesnt match");
        _;
    }

    /**
    * @dev register the ent, may it be manufacturer, swapper or disposer
    * @param ent entity address, entType type of entity
     */
    function register_entity(address ent, uint entType) public onlyPresident{
        entity[ent].entityType = entType;
        entity[ent].chargedBatteries = 0;
        entity[ent].drainedBatteries = 0;
    }

    /**
    * @dev register a battery
    * @param id address of the battery, manufacturer_add is the address of the manufacturer, battery_life is the life of that corresponsding battery
    */
    function register_battery(address id, address manufacturer_add, uint battery_life) public onlyPresident {
        require ( entity[manufacturer_add].entityType == 0,
        "the entity trying to register the battery is not a registered manufacturer"); //condition to check that the
                                                             // batteries are retrieved only from manufacturers

        battery[id].batteryStage = 0;
        battery[id].currentHolder = manufacturer_add;
        battery[id].batteryLife = battery_life;
        battery[id].counter = 0;
        battery[id].batteryStatus = true;
        entity[manufacturer_add].chargedBatteries = entity[manufacturer_add].chargedBatteries + 1;
    }

    /**
    * @dev Add the number of newly charged batteries with an entity and reduce the drained number for that entity.
    * @param addBatteries num of batteries to add
    * used only by the dealer when his batteries are charged
    */
    function addChargeBattery(uint addBatteries)  public {
        require(entity[msg.sender].entityType == 1, "msg sender entity type is not 1");
        entity[msg.sender].chargedBatteries = entity[msg.sender].chargedBatteries + addBatteries;
        entity[msg.sender].drainedBatteries = entity[msg.sender].drainedBatteries - addBatteries;
    }

    /**
    * @dev reduce the charged number of batteries with an entity and increase the drained number for that entity
    * @param dealer address, num of batteries to reduce
    */
    function reduceDrainedBattery(address dealer, uint redBatteries) internal {
        require(entity[dealer].entityType == 1, "dealer entity tyoe is not one");
        entity[dealer].chargedBatteries = entity[dealer].chargedBatteries - redBatteries;
        entity[dealer].drainedBatteries = entity[dealer].drainedBatteries + redBatteries;
    }

    /**
    * @dev recalculate the battery life on every batteryExchange
    * @param id is the battery address, life_reduction is the life to reduce for that particular battery
    */
    function recalculateBatteryLife(address id, uint life_reduction) internal {
        require ( battery[id].batteryLife != 0, "battery life is zero already, it should be disposed");
        if (life_reduction >= battery[id].batteryLife){
            battery[id].batteryLife = 0;
            battery[id].batteryStatus = false;
        }

        else{
            battery[id].batteryLife = battery[id].batteryLife - life_reduction;
        }
    }



    function batteryExchange (address sender, address reciever, uint amount, address drained_id, uint used_life, address charged_id) public{
        //battery can only be exchanged if it is in the ecosystem
        require ( battery[charged_id].batteryStage == 1 && battery[drained_id].batteryStage == 1);
        //battery has to be alive to be exchanged
        require ( ! battery[charged_id].batteryStatus == false, "charged battery status is false");
        require ( ! battery[drained_id].batteryStatus == false, "drained battery status is false");
        //the sender and receiver, both should have had a battery before transacting
        require ( entity[sender].chargedBatteries != 0, "sender doesnt have any batteries to exchange"); // charged batteries because the exchanger will not hafve updated its own battery status ebfore exchanging
        require ( entity[reciever].chargedBatteries != 0, "reciever deosnt have any charged batteries to exchange");

        MyToken token = MyToken(0x64bc9b3a267648643A687E2Feadd4aA959603D25);
        token.transferFrom(sender, reciever, amount);

        reduceDrainedBattery(reciever, 1); //only the dealers charged batteries will be reduced

        battery[charged_id].currentHolder = sender;
        battery[drained_id].currentHolder = reciever;
        battery[charged_id].counter = battery[charged_id].counter + 1;

        recalculateBatteryLife(drained_id, used_life);

    }

    function buyingBatteryFromManufacturer (address manufacturer, address dealer,uint amount, address id) public batteryCorrectStage(id, 0){
        require ( battery[id].batteryStage == 0, "battery stage is 0");
        //update this for the stage to be 1 or 2 depeding on if its user/dealer buying battery
        battery[id].batteryStage = 1;
        battery[id].currentHolder = dealer;
        entity[dealer].chargedBatteries = entity[dealer].chargedBatteries + 1;
        entity[manufacturer].chargedBatteries = entity[manufacturer].chargedBatteries - 1;
        MyToken token = MyToken(0x64bc9b3a267648643A687E2Feadd4aA959603D25);
        token.transferFrom(dealer, manufacturer, amount);
    }

    // get for publicly checking the status
    function batteryStatusView(address id) public view returns (uint stage,uint life,bool status,uint counter,address current_holder)

    {
        return (battery[id].batteryStage, battery[id].batteryLife, battery[id].batteryStatus, battery[id].counter, battery[id].currentHolder);
    }


    function disposeBattery (address id, address sender) public onlyPresident{
        require ( battery[id].batteryLife == 0, "battery life is not yet zero");
        require ( battery[id].batteryStatus == false, "battery status is not false");
        require ( battery[id].batteryStage != 2, "battery stage is not 2, that is its not dead, please recalculate its age");
        battery[id].batteryStage = 2; //converting the battery stage to dead
        battery[id].currentHolder = President;

        require ( entity[sender].drainedBatteries != 0, "drained batteries are 0, the dealer is trying to use the function with 0 batteries available");
        entity[sender].drainedBatteries = entity[sender].drainedBatteries - 1;

        MyToken token = MyToken(0x64bc9b3a267648643A687E2Feadd4aA959603D25);
        token.transfer(sender, 1);
    }

}
