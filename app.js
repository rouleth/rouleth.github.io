// everything inside the event listener, yey!
class Rouleth
{
    // w3;
    // contract;
    // myAccount;

    constructor() {
        if (typeof web3 !== 'undefined') {
            this.w3 = new Web3(web3.currentProvider);
            this.contract = this.w3.eth.contract(contractABI).at(contractAddr);
            this.myAccount = this.w3.eth.accounts[0];

            this.renderPlayers();
            this.newPlayerWatcher();
            Rouleth.log("Loaded");
        } else {
            // no web3
            document.getElementById("play").style.display = "none";
            document.getElementById("no-web3").style.display = "block";
        }
    }

    // Adds message to log
    static log(message) {
        document.getElementById("log").innerHTML += "<br/>" + message;
    }

    // Play the game
    play() {
        this.contract.enterGame({
            gas:1000000,
            gasPrice: 10000000000,
            from: this.myAccount,
            value: this.w3.toWei(0.01, 'ether')
        }, function(error, result) {
            if (!error) {
                Rouleth.log("YOU ENTERED THE GAME")
            } else {
                Rouleth.log(error);
            }
        });
    }

    // Renders the players adding them into the seats
    renderPlayers() {
        let self = this;
        this.contract.getNumberOfPlayers(function (error, nPlayers) {
            self.contract.getCurrentPlayers(function (error, result) {
                for (let i = 0; i < nPlayers; i++) {
                    document.getElementById("player-" + i).innerHTML = "Player " + i + ": " + result[i];
                }
            });
        });
    }

    // Check for new players
    newPlayerWatcher() {
        let self = this;
        let NewPlayerEvent = this.contract.NewPlayer({}, {
            fromBlock: 'latest',
            toBlock: 'latest'
        });
        NewPlayerEvent.watch(function(error, result) {
            Rouleth.log("Someone joined " + result.args.player);
            self.renderPlayers();
        })
    }

    // Show current balance in log
    getCurrentBalance() {
        this.w3.eth.getBalance(this.myAccount, function (error, result) {
            Rouleth.log(this.w3.fromWei(result));
        });
    }
}

// initialize
let rouleth;
window.addEventListener('load', function() {
    rouleth = new Rouleth();
});
