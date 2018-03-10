// everything inside the event listener, yey!
class Rouleth
{
    constructor() {
        if (typeof web3 !== 'undefined') {
            this.w3 = new Web3(web3.currentProvider);
            this.contract = this.w3.eth.contract(contractABI).at(contractAddr);
            this.myAccount = this.w3.eth.accounts[0];

            this.players = {};
            this.deathCount = 0;

            this.initModelFromContract();

            setTimeout(function () {
                self.render();
            }, 1000);

            this.startNewPlayerWatcher();
            this.startNewPlayerAndGameFinishedWatcher();

            Rouleth.log("Loaded");
        } else {
            // no web3
            document.getElementById("play").style.display = "none";
            document.getElementById("no-web3").style.display = "block";
        }
    }


    initModelFromContract() {
        this.getPlayersFromContract();
        this.getDeathCounterFromContract();
        //this.getDeadPlayersFromContract();
    }

    takeASeat() {
        this.contract.enterGame({
            gas:1000000,
            gasPrice: 10000000000,
            from: this.myAccount,
            value: this.w3.toWei(0.01, 'ether')
        }, function(error, result) {
            if (!error) {
                Rouleth.log("YOU ENTERED THE GAME")
            } else {
                Rouleth.log("you can enter only once per round!");
                //Rouleth.log(error);
            }
        });
    }

    resetGame() {
        let self = this;
        this.players = {};
        this.initModelFromContract();
        setTimeout(function () {
            self.render();
        }, 1000);
    }

    addToSeat(address, seat) {
        this.players[parseInt(seat)] = address;
        this.render();
        console.log("added to seat: " + address + " at " + seat);
    }

    /**
     * WATCHERS
     */

    // Check for new players
    startNewPlayerWatcher() {
        let self = this;
        let NewPlayerEvent = this.contract.NewPlayer({}, {
            fromBlock: 'latest',
            toBlock: 'latest'
        });
        NewPlayerEvent.watch(function(error, result) {
            self.getPlayersFromContract();
            Rouleth.log("Someone joined " + result.args.player + " - " + Object.keys(self.players).length);
        });
    }

    // Check for end game
    startNewPlayerAndGameFinishedWatcher() {
        let self = this;
        let NewPlayerAndGameFinishedEvent = this.contract.NewPlayerAndGameFinished({}, {
            fromBlock: 'latest',
            toBlock: 'latest'
        });
        NewPlayerAndGameFinishedEvent.watch(function(error, result) {
            let sender = result.args.sender;
            let players = result.args.players;
            let loser = result.args.loser;
            let maxPlayers = result.args.players.length;
            // first we add to seat
            for (let i = 0; i < maxPlayers; i++) {
                self.addToSeat(players[i], i);
            }
            Rouleth.log("Someone joined " + sender + " - " + Object.keys(self.players).length);

            setTimeout(function(){
                alert('Last player has sit..');
                // then we process result of the game
                for (let i = 0; i < maxPlayers; i++) {
                    if (i == loser) {
                        Rouleth.log(players[i] + " has died.");
                    } else {
                        Rouleth.log(players[i] + " is still alive and got some prize from the dead.");
                    }
                }
                alert('the game is over');
                self.resetGame();
            }, 100);


        });
    }

    /**
     * RENDERS
     */

    render() {
        this.renderCurrentPlayerInfo();
        this.renderPlayers();
        this.renderDeathCount();
        this.renderDeadPlayers();
    }

    renderCurrentPlayerInfo() {

    }

    // Renders the players adding them into the seats
    // THIS FUNCTION IS ONLY FOR WHEN REFRESHING THE BROSWER!!
    // TO LOAD!!!
    renderPlayers() {
        let self = this;
        let len = Object.keys(self.players).length;
        if (len === 0) {
            let e = document.getElementsByClassName("player-seat");
            for (let i = 0; i < e.length; i++) {
                e[i].innerHTML = "Empty";
            }
            return;
        }
        for (let i = 0; i < len; i++) {
            document.getElementById("player-" + i).innerHTML = "Player " + i + ": " + self.players[i];
        }
    }

    renderDeathCount() {
        document.getElementById("deathCounter").innerHTML = this.deathCount;
        //Rouleth.log("renderDeathCount - Not implemented yet");
    }

    renderDeadPlayers() {
        //Rouleth.log("renderDeadPlayers - Not implemented yet");
    }

    /**
     * GET FROM CONTRACTS
     */

    getPlayersFromContract() {
        let self = this;
        self.contract.nPlayers(function (error, nPlayers) {

            self.contract.getPlayers(function (error, result) {
                for (let i = 0; i < nPlayers; i++) {
                    Rouleth.log("refresh: " + result[i] + " -- " + nPlayers);
                    self.addToSeat(result[i], i);
                }
            });
        });
    }

    getDeathCounterFromContract() {
        let self = this;
        this.contract.deathCounter(function (error, deathCounter) {
            Rouleth.log(deathCounter);
            self.deathCount = deathCounter;
        });
    }

    // Renders the dead players adding them into the seats
    getDeadPlayersFromContract() {
        this.contract.deathCounter(function (error, deathCounter) {
            Rouleth.log(deathCounter);

        });
    }

    // Show current balance in log
    getCurrentBalance() {
        let self = this;
        this.w3.eth.getBalance(this.myAccount, function (error, result) {
            Rouleth.log(self.w3.fromWei(result));
        });
    }

    /**
     * HELPERS
     */

    // Adds message to log
    static log(message) {
        document.getElementById("log").innerHTML += "<br/>" + message;
    }
}

// initialize
let rouleth;
window.addEventListener('load', function() {
    rouleth = new Rouleth();
});
