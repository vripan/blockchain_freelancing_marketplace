App = {
  web3Provider: null,
  contracts: {},

  init: async function () {
    return await App.initWeb3();
  },

  initWeb3: async function () {
    if (typeof web3 !== 'undefined') {
      App.web3Provider = web3.currentProvider;
      web3 = new Web3(web3.currentProvider);
      console.log("Web3 provided by metamask");
    } else {
      App.web3Provider = new Web3.providers.HttpProvider('http://localhost:8545');
      web3 = new Web3(App.web3Provider);
      console.log("Web3 provided by localhost");
    }
    return App.initContract();
  },

  initContract: function () {
    var loader = $("#loader");
    var content = $("#content");

    loader.show();
    content.hide();

    $.getJSON("MarketplaceApp.json", function (marketplace) {
      App.contracts.Marketplace = TruffleContract(marketplace);
      App.contracts.Marketplace.setProvider(App.web3Provider);
    });

    $.getJSON("Token.json", function (token) {
      App.contracts.Token = TruffleContract(token);
      App.contracts.Token.setProvider(App.web3Provider);
    });

    if (web3.currentProvider.enable) {
      web3.currentProvider.enable().then(function (acc) {
        App.account = acc[0];
        balance = 0;

        App.contracts.Token.deployed().then(function (tkn) {
          tkn.balanceOf(App.account).then(function (balance) {
            $("#accountAddress").html("Your Account: " + App.account + "<br> Balance: " + balance + " TKN");
          })
        })
      });
    } else {
      $("#accountAddress").html("Provider not enabled");
    }

    loader.hide();
    content.show();
  },
};

$(function () {
  $(window).load(function () {
    App.init();
  });
});
