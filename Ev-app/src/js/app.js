App = {
  web3Provider: null,
  contracts: {},
  names: new Array(),
  url: 'http://127.0.0.1:7545',
  chairPerson:null,
  currentAccount:null,
  formVAlue : {},
  init: function() {
    return App.initWeb3();
  },

  initWeb3: function() {
    console.log("init web3")
    if (typeof web3 !== 'undefined') {
      App.web3Provider = web3.currentProvider;
    } else {
      App.web3Provider = new Web3.providers.HttpProvider(App.url);
    }
    web3 = new Web3(App.web3Provider);

    ethereum.enable();

    App.populateAddress();
    return App.initContract();
  },

  initContract: function() {
    console.log("enter init contract")
      $.getJSON('evBatteryMarketPlace.json', function(data) {
    // Get the necessary contract artifact file and instantiate it with truffle-contract
    var batteryArtifact = data;
    App.contracts.battery = TruffleContract(batteryArtifact);

    // Set the provider for our contract
    App.contracts.battery.setProvider(App.web3Provider);
    
    App.getChairperson();
 
  });
  return App.bindEvents();
  },

  bindEvents: function() {
    console.log(" enter bind events")
   
    $(document).on('click', '#takeAction', function(){ 
      var takeAction = $('#takeActionOption').val(); 
    
    App.handleTakeAction(takeAction); });

    $(document).on('click', '#saleDetails', function(){ 

       App.formVAlue = {
        manufacturerAddress :$('#manufacturerAddress').val(),
        dealerAddress :$('#dealerAddress').val(),
        userAddress :$('#userAddress').val() ,
        batteryID:$('#batteryID').val() ,
        drainedBatteryID:$('#drainedBatteryID').val() ,
        entityType:$('#entityType').val() ,
        }
    console.log(App.formVAlue)
    //App.handleBatterySaleDetails(App.formVAlue); 
  });
   
  },


  handleTakeAction: function(action){
    console.log("main",action)

  if (action == "Register Yourself"){
    if(App.formVAlue.entityType == 0) {
      App.handleRegister(App.formVAlue.manufacturerAddress, App.formVAlue.entityType)
    }
    else if(App.formVAlue.entityType == 1) {
      App.handleRegister(App.formVAlue.dealerAddress, App.formVAlue.entityType)
    }
    else if(App.formVAlue.entityType == 2) {
      App.handleRegister(App.formVAlue.userAddress, App.formVAlue.entityType)
    }
    
  }
  else if(action == "Register the Battery"){
    App.handleRegisterBattery(App.formVAlue.batteryID, App.formVAlue.manufacturerAddress, 10)
  }
  else if(action == "Buy Battery from Manufacturer"){
    App.handleBuyFromManufacturer(App.formVAlue.manufacturerAddress, App.formVAlue.dealerAddress, 10, App.formVAlue.batteryID)
  }
  else if(action == "Buy Battery from Dealer"){
    App.handleBatteryExchange(App.formVAlue.userAddress, App.formVAlue.dealerAddress, 20, App.formVAlue.drainedBatteryID, 10, App.formVAlue.batteryID)
  }
  else if(action == "Dispose Your Battery"){
    App.handleBatteryDisposal(App.formVAlue.batteryID, App.formVAlue.dealerAddress)
  }

},
// handleBatterySaleDetails: function(formValue){
//   console.log("main",App.formValue)

// },

  populateAddress : function(){
    new Web3(new Web3.providers.HttpProvider(App.url)).eth.getAccounts((err, accounts) => {
      web3.eth.defaultAccount=web3.eth.accounts[0]
      jQuery.each(accounts,function(i){
        if(web3.eth.coinbase != accounts[i]){
          var optionElement = '<option value="'+accounts[i]+'">'+accounts[i]+'</option';
          jQuery('#enter_address').append(optionElement);  
        }
      });
    });
  },

  getChairperson : function(){
    App.contracts.battery.deployed().then(function(instance) {
      return instance;
    }).then(function(result) {
      App.chairPerson = result.constructor.currentProvider.selectedAddress.toString();
      App.currentAccount = web3.eth.coinbase;
      if(App.chairPerson != App.currentAccount){
        jQuery('#address_div').css('display','none');
        jQuery('#register_div').css('display','none');
      }else{
        jQuery('#address_div').css('display','block');
        jQuery('#register_div').css('display','block');
      }
    })
  },

  handleRegister: function(addr, entityType){
    console.log("main",addr)
    var batteryInstance;
    web3.eth.getAccounts(function(error, accounts) {
    var account = accounts[0];
    App.contracts.battery.deployed().then(function(instance) {
      batteryInstance = instance;
      return batteryInstance.register_entity(addr, entityType, {from: account});
    }).then(function(result, err){
        if(result){
            if(parseInt(result.receipt.status) == 1){
              if (entityType == 0){
                alert(addr + " registration for manufacturer done successfully")
              }
              else if(entityType == 1){
                alert(addr + " registration for dealer done successfully")
              }
              else if (entityType == 2){
                alert(addr + " registration for user done successfully")
              }
            }
            else
            alert(addr + " registration not done successfully due to revert")
        } else {
            alert(addr + " registration failed")
        }   
    })
    })
},

handleRegisterBattery: function(battId, manuAddr, batteryLife){
  console.log("main",manuAddr)
  var batteryInstance;
  web3.eth.getAccounts(function(error, accounts) {
  var account = accounts[0];
  App.contracts.battery.deployed().then(function(instance) {
    batteryInstance = instance;
    return batteryInstance.register_battery(battId, manuAddr, batteryLife, {from: account});
  }).then(function(result, err){
      if(result){
          if(parseInt(result.receipt.status) == 1)
          alert(battId + " registration of the battery is done successfully")
          else
          alert(battId + " registration for the battery is not done successfully due to revert")
      } else {
          alert(battId + " registration failed")
      }   
  })
  })
},

handleBuyFromManufacturer: function(manuAddr, dealAddr, amount, battId){
  console.log("main",manuAddr)
  var batteryInstance;
  web3.eth.getAccounts(function(error, accounts) {
  var account = accounts[0];
  App.contracts.battery.deployed().then(function(instance) {
    batteryInstance = instance;
    return batteryInstance.buyingBatteryFromManufacturer(manuAddr, dealAddr, amount, battId);
  }).then(function(result, err){
      if(result){
          if(parseInt(result.receipt.status) == 1)
          alert(battId + " Battery bought from manufacturer succesfully")
          else
          alert(battId + " Battery bought from manufacturer unsuccesfully")
      } else {
          alert(battId + " Failed Transaction")
      }   
  })
  })
},

handleBatteryExchange: function(user, dealer, amount, drained_battery_id, used_life, charged_battery_id){
  console.log("main",user)
  var batteryInstance;
  web3.eth.getAccounts(function(error, accounts) {
  var account = accounts[0];
  App.contracts.battery.deployed().then(function(instance) {
    batteryInstance = instance;
    return batteryInstance.batteryExchange(user, dealer, amount, drained_battery_id, used_life, charged_battery_id);
  }).then(function(result, err){
      if(result){
          if(parseInt(result.receipt.status) == 1)
          alert(battId + " Battery excahnged from dealer succesfully")
          else
          alert(battId + " Battery exchange from dealer unsuccesfully")
      } else {
          alert(battId + " Failed Transaction")
      }   
  })
  })
},

handleBatteryDisposal: function(battery_id, dealer){
  console.log("main",user)
  var batteryInstance;
  web3.eth.getAccounts(function(error, accounts) {
  var account = accounts[0];
  App.contracts.battery.deployed().then(function(instance) {
    batteryInstance = instance;
    return batteryInstance.disposeBattery(battery_id, dealer, {from: account});
  }).then(function(result, err){
      if(result){
          if(parseInt(result.receipt.status) == 1)
          alert(battId + " Battery disposed succesfully")
          else
          alert(battId + " Battery disposal unsuccesfully")
      } else {
          alert(battId + " Failed Transaction")
      }   
  })
  })
},
};

$(function() {
  $(window).load(function() {
    App.init();
  });
});
