document.addEventListener('DOMContentLoaded', () => {
    const usergrid = document.querySelector('.grid-user');
    const computergrid= document.querySelector('.grid-computer');
    const displaygrid = document.querySelector('.grid-display');
    const ships = document.querySelectorAll('.ship');
    const destroyer = document.querySelector('.destroyer-container');
    const submarine = document.querySelector('.submarine-container');
    const cruiser = document.querySelector('.cruiser-container');
    const battleship = document.querySelector('.battleship-container');
    const carrier = document.querySelector('.carrier-container');
    const gold = document.querySelector('.gold-container')
    const StartButton = document.querySelector('#start');
    const rotatebutton = document.querySelector('#rotate');
    const turndisplay = document.querySelector('#whose-go');
    const infodisplay = document.querySelector('#info');
    const singleplayerbutton = document.querySelector('#singleplayerbutton')
    const multiplayerplayerbutton = document.querySelector('#multiplayerbutton')

    const usersquares = [ ];
    const computersquares = [ ];
    let ishorizontal = true;
    let isgameover = false;
    let currentplayer = 'user';
    const width = 10;
    let gamemode = "";
    let playernumber = 0;
    let ready = false;
    let enemyReady = false;
    let allShipsplaced = false;
    let shotfired = -1;

    //select player mode
    singleplayerbutton.addEventListener('click', startsingleplayer)
    multiplayerplayerbutton.addEventListener('click', startmultiplayer)



    //multiplayer
    function startmultiplayer() {
        const socket = io();

        //get your player number
        socket.on('player-number', num => {
            if(num === -1) {
                infodisplay.innerHTML = "Sorry the server is full"
            } else {
                playernumber = parseInt(num)
                if(playernumber === 1) currentplayer = "enemy"

                console.log(playernumber)

                //get other player status
                socket.emit('check-players')
            }
        })

        //another player connect or disconet
        socket.on('player-connection', num => {
            console.log(`player number ${num} has connected or disconnected`) 
            playerconnectordis(num)
        })

        //on enemy ready
        socket.on('enemy-ready', num => {
            enemyReady = true;
            playerready(num)
            if(ready) playergameMulti(socket)

        })

        // check player stat
        socket.on('check-players', players => {
            players.forEach((p, i) => {
                if(p.connected) playerconnectordis(i)
                if(p.ready) {
                    playerready(i)
                    if(i !== playernumber) enemyReady = true
                }
            })
        })

        //on timeout
        socket.on('timeout', () => {
            infodisplay.innerHTML = 'you have the 10 minute linit'
        })

        //ready button click
        StartButton.addEventListener('click', () => {
            if(allShipsplaced) playergameMulti(socket)
            else infodisplay.innerHTML = "Please place all ships"
        })

        // set up eventlistener to fire
        computersquares.forEach(square => {
            square.addEventListener('click', () => {
                if(currentplayer === 'user' && ready && enemyReady) {
                    shotfired = square.dataset.id
                    socket.emit('fire', shotfired)
                }
            })
        })

        //on fire recive
        socket.on('fire', id => {
            enemyGo(id)
            const square = usersquares[id]
            socket.emit('fire-reply', square.classList)
            playergameMulti(socket)
        })

        //on fire reply revieced
        socket.on('fire-reply', classList => {
            revealSquare(classList) 
            playergameMulti(socket)
        })

        function playerconnectordis(num) {
            let player = `.p${parseInt(num) + 1}`
            document.querySelector(`${player} .connected span`).classList.toggle('green')
            if(parseInt(num) === playernumber) document.querySelector(player).style.
            fontWeight ='bold'
        }
    }

    //single player
    function startsingleplayer() {
        gamemode = "singlePlayer"
        genarate(shiparray[0])
        genarate(shiparray[1])
        genarate(shiparray[2])
        genarate(shiparray[3])
        genarate(shiparray[4])
        genarate(shiparray[5])

        StartButton.addEventListener('click', playgamesingle)
    }

    //create board
    function createboard(grid, squares) {
        for(let i = 0; i < width * width; i++){
            const square = document.createElement('div');
            square.dataset.id = i
            grid.appendChild(square)
            squares.push(square)
        }
    }
    createboard(usergrid, usersquares)
    createboard(computergrid, computersquares)

    //ships
    const shiparray = [
        {
            name: 'destroyer',
            directions: [
                [0, 1],
                [0, width]
            ]
        },
        {
            name: 'submarine',
            directions: [
                [0, 1, 2],
                [0, width, width*2]
            ]
        },
        {
            name: 'cruiser',
            directions: [
                [0, 1, 2],
                [0, width, width*2]
            ]
        },
        {
            name: 'battleship',
            directions: [
                [0, 1, 2, 3],
                [0, width, width*2, width*3]
            ]
        },
        {
            name: 'carrier',
            directions: [
                [0, 1, 2, 3 ,4],
                [0, width, width*2, width*3, width*4]
            ]
        },
        {
            name: 'gold',
            directions: [
                [0, 1, 2, 3 ,4],
                [0, width, width*2, width*3, width*4]
            ]
        }
    ]

    // Draw the computers ship in random locations
    function genarate(ship) {
        let randomdirection = Math.floor(Math.random() * ship.directions.length)
        let current = ship.directions[randomdirection]
        if(randomdirection === 0) direction = 1 
        if(randomdirection === 1) direction = 10
        let randomstart = Math.abs(Math.floor(Math.random() * computersquares.length - (ship.directions[0].length * direction)))
        
        const istaken = current.some(index => computersquares[randomstart + index].classList.contains('taken'))
        const isatrightedge = current.some(index => (randomstart + index) % width === width - 1)
        const isatleftedge = current.some(index => (randomstart + index) % width === 0)

        if(!istaken && !isatrightedge && !isatleftedge) current.forEach(index => computersquares[randomstart + index].classList.add('taken', ship.name))

        else genarate(ship)
    }



    //rotate ships
    function rotate() {
        if(ishorizontal) {
            destroyer.classList.toggle('destroyer-container-vertical')
            submarine.classList.toggle('submarine-container-vertical')
            cruiser.classList.toggle('cruiser-container-vertical')
            battleship.classList.toggle('battleship-container-vertical')
            carrier.classList.toggle('carrier-container-vertical')
            gold.classList.toggle('gold-container-vertical')
            ishorizontal = false
            return
        }
        if(!ishorizontal) {
            destroyer.classList.toggle('destroyer-container')
            submarine.classList.toggle('submarine-container')
            cruiser.classList.toggle('cruiser-container')
            battleship.classList.toggle('battleship-container')
            carrier.classList.toggle('carrier-container')
            gold.classList.toggle('gold-container')
            ishorizontal = true
            return
        }
    }
    rotatebutton.addEventListener('click', rotate)

    //drag and drop
    ships.forEach(ship => ship.addEventListener('dragstart', dragStart))
    usersquares.forEach(square => square.addEventListener('dragstart', dragStart))
    usersquares.forEach(square => square.addEventListener('dragover', dragOver))
    usersquares.forEach(square => square.addEventListener('dragenter', dragEnter))
    usersquares.forEach(square => square.addEventListener('dragleave', dragLeave))
    usersquares.forEach(square => square.addEventListener('drop', dragdrop))
    usersquares.forEach(square => square.addEventListener('dragend', dragEnd))

    let selectedshipnamewithindex
    let draggedship
    let draggedshipLength


    ships.forEach(ship => ship.addEventListener('mousedown', (e) => {
        selectedshipnamewithindex = e.target.id
    }))

    function dragStart() {
        draggedship = this
        draggedshipLength = this.childNodes.length
    }

    function dragOver(e) {
        e.preventDefault()
    }

    function dragEnter(e) {
        e.preventDefault()
    }

    function dragLeave() {
        console.log('vjhjhzv')
    }

    function dragdrop() {
        let shipNameWithLastId = draggedship.lastChild.id
        let shipClass = shipNameWithLastId.slice(0,-2)
        let lastShipIndex = parseInt(shipNameWithLastId.substr(-1))
        let shipLastId = lastShipIndex + parseInt(this.dataset.id)
        const notAllowedhorizontal = [0, 10, 20, 30, 40,50, 60, 70 , 80, 90 ,11,21,31,41,51,61,71,81,91,2,22,32,42,52,72,82,92, 3,13,23,33,43,53,63,73,83,92];
        const notAllowedverical = [99, 98, 97, 96, 95, 94, 93, 92, 91, 90, 89, 88, 87, 86, 85, 84, 83, 82, 81, 80, 79, 78, 77, 76, 75, 74, 73, 72, 71, 69, 68, 67, 66, 65, 64, 63, 62, 61, 60]
        
        let newallowedhorizontal = notAllowedhorizontal.splice(0, 10 * lastShipIndex)
        let newallowedvertical = notAllowedverical.splice(0, 10 * lastShipIndex)

        selectedShipIndex = parseInt(selectedshipnamewithindex.substr(-1))

        shipLastId = shipLastId - selectedShipIndex

        if(ishorizontal && !newallowedhorizontal.includes(shipLastId)) {
            for(let i= 0; i < draggedshipLength; i++) {
                usersquares[parseInt(this.dataset.id) - selectedShipIndex + i].classList.add('taken',shipClass)
            }
        } else if(!ishorizontal && !newallowedvertical.includes(shipLastId)) {
            for(let i= 0; i < draggedshipLength; i++) {
                usersquares[parseInt(this.dataset.id) - selectedShipIndex + width*i].classList.add('taken', shipClass)
            }
        } else return


        displaygrid.removeChild(draggedship)
        if(!displaygrid.querySelector('.ship')) allShipsplaced = true
    }

    function dragEnd() {

    }

    //gamelogic for multiplayer
    function playergameMulti(socket) {
        if(isgameover) return
        if(!ready) {
            socket.emit('player-ready')
            ready = true
            playerready(playernumber)
        }

        if(enemyReady) {
            if(currentplayer === 'user') {
                turndisplay.innerHTML = 'Your Go'
            }
            if(currentplayer === 'enemy') {
                turndisplay.innerHTML = "Enemy's go"
            }
        }
    }

    function playerready(num) {
        let player = `.p${parseInt(num) + 1}`
        document.querySelector(`${player} .ready span`).classList.toggle('green')
    }

    //game logic for single player
    function playgamesingle() {
        if(isgameover) return
        if(currentplayer === 'user') {
            turndisplay.innerHTML = 'your go'
            computersquares.forEach(square => square.addEventListener('click', function(e) {
                shotfired = square.dataset.id
                revealSquare(square.classList)
            }))
        }
        if(currentplayer === 'enemy') {
            turndisplay.innerHTML = 'Computers go'
            setTimeout(enemyGo, 1000)
        }
    }

    let destroyerCount = 0;
    let submarinecount = 0;
    let cruisercount = 0;
    let battleshipcount = 0;
    let carriercount = 0;
    let goldcount = 0;


    function revealSquare(classlist) {
        const enemysquare = computergrid.querySelector(`div[data-id='${shotfired}']`)
        const obj = Object.values(classlist)
        if(!enemysquare.classList.contains('boom') && currentplayer === 'user' && !gameover) {
        if(obj.includes('destroyer')) destroyerCount++
        if(obj.includes('submarine')) submarinecount++
        if(obj.includes('cruiser')) cruisercount++
        if(obj.includes('battlehip')) battleshipcount++
        if(obj.includes('carrier')) carriercount++
        if(obj.includes('gold')) goldcount++
        }
        if(obj.includes('taken')) {
            enemysquare.classList.add('boom')
        } else {
            enemysquare.classList.add('miss')
        }
        checkforwins()
        currentplayer = 'enemy'
        if(gameover === 'singlePlayer') playgamesingle()
    }

    let cpudestroyerCount = 0;
    let cpusubmarinecount = 0;
    let cpucruisercount = 0;
    let cpubattleshipcount = 0;
    let cpucarriercount = 0;
    let cpugoldcount = 0;

    function enemyGo(square) {
        if(gamemode === 'singlePlayer') square = Math.floor(Math.random() * usersquares.length)
        if (!usersquares[square].classList.contains('boom')) {
        usersquares[square].classList.add('boom')
        if(usersquares[square].classList.contains('destroyer')) cpudestroyerCount++
        if(usersquares[square].classList.contains('submarine')) cpusubmarinecount++
        if(usersquares[square].classList.contains('cruiser')) cpucruisercount++
        if(usersquares[square].classList.contains('battlehip')) cpubattleshipcount++
        if(usersquares[square].classList.contains('carrier')) cpucarriercount++
        if(usersquares[square].classList.contains('gold')) cpugoldcount++
        checkforwins()
        } else if (gamemode === 'singlePlayer') enemyGo()
        currentplayer = 'user'
        turndisplay.innerHTML = 'your go'
    }

    function checkforwins() {
        let enemy = 'enemy'
        if(gameover === 'multiPlayer') enemy = 'enemy'
        if(destroyerCount === 2) {
            infodisplay.innerHTML = `You Sunk the ${enemy}s destroyer`
            destroyerCount = 10
        }
        if(submarinecount === 3) {
            infodisplay.innerHTML = `You Sunk the ${enemy}s submarine`
            submarinecount = 10
        }
        if(cruisercount === 3) {
            infodisplay.innerHTML = `You Sunk the ${enemy}s cruiser`
            cruisercount = 10
        }
        if(battleshipcount === 4) {
            infodisplay.innerHTML = `You Sunk the ${enemy}s battleship`
            battleshipcount = 10
        }
        if(carriercount === 5) {
            infodisplay.innerHTML = `You Sunk the ${enemy}s carrier`
            carriercount = 10
        }
        if(goldcount === 5) {
            infodisplay.innerHTML = `You Sunk the ${enemy}s gold ship`
            goldcount = 10
        }
        ///
        ///
        if(cpudestroyerCount === 2) {
            infodisplay.innerHTML = `${enemy} sunk your destroyer`
            cpudestroyerCount = 10
        }
        if(cpusubmarinecount === 3) {
            infodisplay.innerHTML = `${enemy} sunk your submarine`
            cpusubmarinecount = 10
        }
        if(cpucruisercount === 3) {
            infodisplay.innerHTML = `${enemy} sunk your cruiser`
            cpucruisercount = 10
        }
        if(cpubattleshipcount === 4) {
            infodisplay.innerHTML = `${enemy} sunk your battleship`
            cpubattleshipcount = 10
        }
        if(cpucarriercount === 5) {
            infodisplay.innerHTML = `${enemy} sunk your carrier`
            cpucarriercount = 10
        }
        if(cpugoldcount === 5) {
            infodisplay.innerHTML = `${enemy} sunk your gold ship`
            cpugoldcount = 10
        }
        if((destroyerCount + submarinecount + cruisercount + battleshipcount + carriercount + goldcount) === 50) {
            infodisplay.innerHTML = 'you win'
            gameover()
        }
        if((cpudestroyerCount + cpusubmarinecount + cpucruisercount + cpubattleshipcount + cpucarriercount + cpugoldcount) === 50) {
            infodisplay.innerHTML = `${enemy.toLocaleUpperCase()} Wins`
            gameover()
        }
    }

    function gameover() {
        isgameover = true;
        StartButton.removeEventListener('click', playgamesingle)
    }




})
