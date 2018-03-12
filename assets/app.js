/**
 * Rouleth, the ethereum russian rouleth.
 */
let app = angular.module("Rouleth", []);

app.controller("mainControler", function($scope) {
    // the model of rouleth, this is an object with all the model
    $scope.w3 = null;
    $scope.contract = null;
    $scope.account = "0x000...";
    $scope.balance = "0";
    $scope.rouleth = {
        players: {
            0: "EMPTY",
            1: "EMPTY",
            2: "EMPTY",
            3: "EMPTY",
            4: "EMPTY",
            5: "EMPTY"
        },
        deathCounter: 0
    };

    // init
    $scope.init = function () {
        if (typeof web3 !== 'undefined') {
            $scope.w3 = new Web3(web3.currentProvider);
            $scope.contract = $scope.w3.eth.contract(contractABI).at(contractAddr);
            $scope.account = $scope.w3.eth.accounts[0];

            $scope.getCurrentBalance();
            $scope.getPlayersFromContract();
            $scope.startNewPlayerWatcher();
            $scope.startNewPlayerAndGameFinishedWatcher();

            console.log($scope.rouleth);
        } else {
            // no web3
            document.getElementById("play").style.display = "none";
            document.getElementById("no-web3").style.display = "block";
        }
    };

    // executes enter the game contract, inviting the user to accept in metamask
    $scope.takeASeat = function () {
        $scope.contract.enterGame({
            gas: 1000000,
            gasPrice: 10000000000,
            from: $scope.account,
            value: $scope.w3.toWei(0.01, 'ether')
        }, function(error, result) {
            if (!error) {
                console.log("You took a seat")
            } else {
                console.log("You can enter only once per round! or you are dead!");
                alert("You can enter only once per round! or you are dead!");
            }
        });
    };

    // call the contract and render the players
    $scope.getPlayersFromContract = function () {
        $scope.contract.nPlayers(function (error, nPlayers) {
            $scope.contract.getPlayers(function (error, result) {
                $scope.$applyAsync(function () {
                    for (let i = 0; i < nPlayers; i++) {
                        $scope.rouleth.players[i] = result[i];
                    }
                });
            });
        });
    };

    // renders the death counter
    $scope.getDeathCounterFromContract = function () {
        $scope.contract.deathCounter(function (error, deathCounter) {
            $scope.$applyAsync(function () {
                $scope.rouleth.deathCounter = deathCounter;
            });
        });
    };

    // show current balance
    $scope.getCurrentBalance = function () {
        $scope.w3.eth.getBalance($scope.account, function (error, result) {
            $scope.$applyAsync(function () {
                $scope.balance = $scope.w3.fromWei(result);
            });
        });
    };

    // when a new player enters the game, we get all players from the contract
    // this is like this atm because sometimes a watcher is executeself.addToSeat(result[i], i);d twice, but don't know why
    $scope.startNewPlayerWatcher = function () {
        let NewPlayer = $scope.contract.NewPlayer({}, {
            fromBlock: 'latest',
            toBlock: 'latest'
        });
        NewPlayer.watch(function(error, result) {
            $scope.getPlayersFromContract();
            console.log(result.args.player + " joined the game");
        });
    };

    // when the last player enters the game, this watcher is triggered instead of startNewPlayerWatcher
    $scope.startNewPlayerAndGameFinishedWatcher = function () {
        let NewPlayerAndGameFinished = $scope.contract.NewPlayerAndGameFinished({}, {
            fromBlock: 'latest',
            toBlock: 'latest'
        });
        NewPlayerAndGameFinished.watch(function(error, result) {
            let sender = result.args.sender;
            let players = result.args.players;
            let loser = result.args.loser;
            let maxPlayers = result.args.players.length;

            $scope.$applyAsync(function () {
                // first we add to seat all the players
                for (let i = 0; i < maxPlayers; i++) {
                    $scope.rouleth.players[i] = players[i];
                }
                console.log(sender + " joined the game");
                console.log("The table is full, let's proceed...");
            });
            setTimeout(function () {
                alert("The table is full, let's proceed...");
                $scope.$applyAsync(function () {
                    // then we process result of the game
                    for (let i = 0; i < maxPlayers; i++) {
                        if (i == loser) {
                            $scope.rouleth.players[i] = $scope.rouleth.players[i] + ' IS DEAD';
                        } else {
                            $scope.rouleth.players[i] = $scope.rouleth.players[i] + ' WINS';
                        }
                    }
                    console.log("Player " + loser + " is the looser");
                });
                setTimeout(function () {
                    $scope.$applyAsync(function () {
                        alert("Player " + loser + " is the looser");
                        // resetting...
                        for (let i = 0; i < maxPlayers; i++) {
                            $scope.rouleth.players[i] = 'EMPTY';
                        }
                    });
                }, 1000);
            }, 1000);
        });
    };

    // initialize
    $scope.init();
});
