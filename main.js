(function() {

  'use strict';

  var Cell = (function() {

    var Cell = function( config ) {
      this.el = config.el;
    };

    Cell.fn = Cell.prototype;

    Cell.fn.IS_SNAKE_CLASS = 'is-snake';

    Cell.fn.IS_PILL_CLASS = 'is-pill';

    Cell.fn.setAsSnake = function() {
      this.el.classList.add( this.IS_SNAKE_CLASS );
    };

    Cell.fn.setAsPill = function() {
      this.el.classList.add( this.IS_PILL_CLASS );
    };

    Cell.fn.clear = function() {
      this.el.classList.remove( this.IS_SNAKE_CLASS );
      this.el.classList.remove( this.IS_PILL_CLASS );
    };

    return Cell;

  })();

  var Grid = (function() {

    var Grid = function() {
      this.cells = this.getCells();
    };

    Grid.fn = Grid.prototype;

    Grid.fn.getCells = function() {
      var rows = document.querySelectorAll( '.grid__row' );
      return Array.prototype.map.call( rows, this.getCellsInRow, this );
    };

    Grid.fn.getCellsInRow = function( row ) {
      var cells = row.querySelectorAll( '.grid__cell' );
      return Array.prototype.map.call( cells, this.createCell );
    };

    Grid.fn.createCell = function( cell ) {
      return new Cell({
        el: cell
      });
    };

    Grid.fn.cellAt = function( coordinate ) {
      var x = coordinate[ 0 ],
        y = coordinate[ 1 ],
        cell = this.cells[ x ][ y ];

      return cell;
    };

    return Grid;

  })();

  var Snake = (function() {

    var Snake = function( config ) {
      // TODO: snake shouldn't need to know about Game as it is a subview
      this.game = config.game;
      this.grid = this.game.grid;
      this.directions = this.game.directions;
      this.collision = false;
      this.pillCollision = false;
      // TODO: generate body array
      this.body = [ [0,0], [0,1], [0,2] ];
      this.setHead();
      this.setTail();
      this.direction = this.directions.RIGHT;
      this.init();
    };

    Snake.fn = Snake.prototype;

    Snake.fn.getTail = function() {
      return this.body[ 0 ];
    };

    Snake.fn.setTail = function() {
      this.tail = this.getTail();
    };

    Snake.fn.getHead = function() {
      return this.body[ this.body.length - 1 ];
    };

    Snake.fn.setHead = function() {
      this.head = this.getHead();
    };

    Snake.fn.redraw = function() {

      // TODO: remove all collision detection and put in game loop

      switch( this.direction ) {
      case this.directions.LEFT:
        this.moveLeft();
        break;
      case this.directions.RIGHT:
        this.moveRight();
        break;
      case this.directions.UP:
        this.moveUp();
        break;
      case this.directions.DOWN:
        this.moveDown();
        break;
      }

      this.checkForPillCollision();

      if ( !this.pillCollision ) {
        this.removeTail();
      } else {
        this.pillCollision = false;
        this.game.removePill();
      }

      this.checkForCollision();

      if ( this.collision ) {
        this.game.end();
      }

      this.addNewHead();

      this.setTail();
      this.setHead();

      this.draw();
    };

    Snake.fn.moveLeft = function() {
      var y = this.head[ 0 ],
        x = this.head[ 1 ] - 1;
      this.newHead = [ y, x ];
    };

    Snake.fn.moveRight = function() {
      var y = this.head[ 0 ],
        x = this.head[ 1 ] + 1;
      this.newHead = [ y, x ];
    };

    Snake.fn.moveUp = function() {
      var y = this.head[ 0 ] - 1,
        x = this.head[ 1 ];
      this.newHead = [ y, x ];
    };

    Snake.fn.moveDown = function() {
      var y = this.head[ 0 ] + 1,
        x = this.head[ 1 ];
      this.newHead = [ y, x ];
    };

    Snake.fn.addNewHead = function() {
      this.body.push( this.newHead );
    };

    Snake.fn.removeTail = function() {
      this.grid.cellAt( this.tail ).clear();
      this.body.shift();
    };

    Snake.fn.draw = function() {
      this.body.forEach( function( coordinate ) {
        try {
          this.grid.cellAt( coordinate ).setAsSnake();
        } catch( e ) {
          this.game.end();
        }
      }, this );
    };

    Snake.fn.checkForCollision = function() {
      this.body.forEach( this.isSameAsNewHead, this );
    };

    Snake.fn.checkForPillCollision = function() {
      return this.newHead[ 0 ] === this.game.pillPosition[ 0 ] && this.newHead[ 1 ] === this.game.pillPosition[ 1 ];
    };

    Snake.fn.isSameAsNewHead = function( cell ) {
      if ( cell[ 0 ] === this.newHead[ 0 ] && cell[ 1 ] === this.newHead[ 1 ] ) {
        this.collision = true;
      }
    };

    Snake.fn.setDirection = function( direction ) {
      if ( this.direction === this.directions.LEFT && direction === this.directions.RIGHT ||
        this.direction === this.directions.RIGHT && direction === this.directions.LEFT ||
        this.direction === this.directions.UP && direction === this.directions.DOWN ||
        this.direction === this.directions.DOWN && direction === this.directions.UP ) {
        return false;
      }
      this.direction = direction;
    };

    Snake.fn.init = function() {
      this.redraw();
    };

    return Snake;

  })();

  var Game = (function() {

    var Game = function() {
      this.grid = new Grid();
      this.placePill();
      this.snake = new Snake({
        game: this
      });
      this.bindEvents();
      this.init();
    };

    Game.fn = Game.prototype;

    Game.fn.directions = {
      LEFT: 'left',
      RIGHT: 'right',
      UP: 'up',
      DOWN: 'down'
    };

    Game.fn.frameRate = 8;

    Game.fn.bindEvents = function() {
      document.addEventListener( 'keyup', this.changeSnakeDirection.bind( this ) );
    };

    Game.fn.changeSnakeDirection = function( e ) {
      var keyCode = e.keyCode;
      switch( keyCode ) {
      case 37:
        this.snake.setDirection( this.directions.LEFT );
        break;
      case 39:
        this.snake.setDirection( this.directions.RIGHT );
        break;
      case 38:
        this.snake.setDirection( this.directions.UP );
        break;
      case 40:
        this.snake.setDirection( this.directions.DOWN );
        break;
      }
    };

    Game.fn.placePill = function() {
      // TODO: randomise placement of pill
      // TODO: pill should be a class
      this.pillPosition = [ 9, 9 ];
      this.grid.cellAt( this.pillPosition ).setAsPill();
    };

    Game.fn.removePill = function() {
      var cell = this.grid.cellAt( this.pillPosition );
      cell.clear();
      cell.setAsSnake();
    };

    Game.fn.loop = function() {
      // TODO: move all collision detection in here
      this.snake.redraw();
    };

    Game.fn.end = function() {
      clearInterval( this.tick );
      alert('Whoops, you dead!');
    };

    Game.fn.init = function() {
      this.tick = setInterval( this.loop.bind( this ), ( 1000 / this.frameRate ) );
    };

    return Game;

  })();

  document.addEventListener( 'DOMContentLoaded', function() {
    new Game();
  });

})();

window.log=function(){log.history=log.history||[];log.history.push(arguments);if(this.console){console.log(Array.prototype.slice.call(arguments))}};