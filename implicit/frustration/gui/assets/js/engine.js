/**
 * @file Engine - Implicit Frustration UI
 * @author Alexandre Blanchet
 */
"use strict";

/**
 * Implicit frustration Engine
 *
 * @see: Neuroadaptive technology enables implicit cursor control based on medial prefrontal cortex activity
 *
 * @mixes Dispatcher
 */
class Engine {
  /**
   * @param {Object} options]
   * @param {Object} options.grid
   * @param {Object} options.grid.parameters - grid parameters
   * @param {number} options.grid.parameters.rows - number of rown
   * @param {number} options.grid.parameters.columns - number of columns
   * @param {number} options.grid.parameters.grid_tx - size that the grid takes in the canvas between 0 and 1
   * @param {number} options.grid.parameters.lines_width - lines width
   * @param {number} options.grid.parameters.canvas_size - canvas size in px
   * @param {Object} options.grid.parameters.element - html canvas location
   * @param {Object} options.grid.colors
   * @param {string} options.grid.colors.background
   * @param {string} options.grid.colors.cell
   * @param {string} options.grid.colors.ray
   * @param {string} options.grid.colors.target
   * @param {string} options.grid.colors.cursor
   * @param {string} options.grid.colors.text
   * @param {string} options.grid.rules
   * @param {string} options.grid.rules.text - rules of the experiment displayed at the beginning
   * @param {Object} options.engine
   * @param {number} options.engine.sessions - number of grids during the experiment
   * @param {number} options.engine.max_step - maximum number of steps before a new grid
   * @param {number} options.engine.durations
   * @param {number} options.engine.durations.step - time to wait between steps
   * @param {number} options.engine.durations.new_grid - time to wait between new grids
   * @param {Object} options.engine.keys
   * @param {boolean} options.engine.keys.activate - if true wait for wait for a user to press a key
   * @param {char} options.engine.keys.good - key to press to consider that the cursor movement is good (green)
   * @param {char} options.engine.keys.bad - key to press to consider that the cursor movement is bad (red)
   * @param {char} options.engine.instructions - html instructions location
   */
  constructor(options = {}) {
    var default_options = {
      grid: {
        grid: {
          rows: 4,
          columns: 4,
        },
        rules: {
          //            text:  "Hello :),\n\
          //During this experiment we will observe the implicit reaction of \n\
          //your brain to events happening on a grid with randomly \n\
          //moving pieces. \n\
          //The reactions we are trying to observe are implicit, so they are \n\
          //independent of your own will. \n\
          //Each time the piece moves you must press green if you \n\
          //consider the move to be good or red if it is bad. \n\",
          text: "Bonjour,\n\
        Au cours de cette expérience, nous allons observer la réaction \n\
        implicite de votre cerveau à des évenements qui se produisent \n\
        avec un pion qui se déplace aléatoirement sur une grille. \n\
        Les réactions que nous essayons d'observer sont implicites, \n\
        donc indépendantes de votre propre volonté. \n\
        Entre chaque déplacement vous devez appuyer sur le boutton \n\
        vert si vous considérez que le pion se déplace dans la bonne \n\
        direction ou sur le boutton rouge si vous considérez que le \n\
        pions ne se déplace pas dans la bonne direction.",
        },
      },
      engine: {
        durations: {
          step: 1000,
          new_grid: 1000,
        },
        keys: {
          activate: false,
          good: "b",
          bad: "v",
        },
        sessions: 5,
        max_step: 15,
        instructions: document.getElementById("instructions"),
      },
    };
    this.options = merge(default_options, options);
    this.io = new IO();

    this.scheduler = new Scheduler();
    this.scheduler.start();

    this.grid = new Grid(this.options.grid);
    this.status = "ready";
  }

  /**
   *  Indicate to engine that the calibration is done
   */
  calibrated() {
    this.status = "calibrated";
    this.io.event("calibrated");
  }

  /**
   * Run engine
   */
  async run() {
    this.status = "running";
    this.io.event("start");

    var key;
    for (
      let session_id = 1;
      session_id <= this.options.engine.sessions;
      session_id++
    ) {
      this.grid.clean();
      this.grid.init();
      this.grid.show();

      await sleep(this.options.engine.durations.new_grid);

      await this.scheduler.asap(() => {
        this.grid.random_cursor_target();
        this.io.event("grid", {
          rows: this.grid.options.grid.rows,
          columns: this.grid.options.grid.columns,
          target: this.grid.target.id,
          cursor: this.grid.cursor.id,
        });
      });

      this.options.engine.instructions.innerHTML =
        "grid " +
        session_id +
        "/" +
        this.options.engine.sessions +
        " -- step " +
        0 +
        "/" +
        this.options.engine.max_step;
      for (
        var step = 1;
        !this.grid.is_end() && step <= this.options.engine.max_step;
        step++
      ) {
        await sleep(this.options.engine.durations.step);

        if (this.status == "suspend") {
          while (this.status == "suspend") {
            await sleep(100);
          }
          await sleep(this.options.engine.durations.step);
        }
        await this.scheduler.asap(() => {
          this.grid.random_step();
          this.io.event("step", {
            win: this.grid.is_end(),
            cursor: this.grid.cursor.id,
          });
        });

        this.options.engine.instructions.innerHTML =
          "grid " +
          session_id +
          "/" +
          this.options.engine.sessions +
          " -- step " +
          step +
          "/" +
          this.options.engine.max_step;

        if (this.options.engine.keys.activate == true) {
          key = await waitingKeypress([
            this.options.engine.keys.good,
            this.options.engine.keys.bad,
          ]);
          this.io.event("key", {
            key: key === this.options.engine.keys.good ? true : false,
          });
        }
      }
    }

    this.grid.clean();
    this.options.engine.instructions.innerHTML = "End, Thank you";
    this.status = "end";
    this.io.event("end");
  }

  /**
   * Suspend engine
   */
  suspend() {
    this.status = "suspend";
    this.io.event("suspend");
  }

  /**
   * Continue after suspend
   */
  continue() {
    this.status = "running";
    this.io.event("continue");
  }
}
