/**
 * @file Grid - Implicit Frustration UI
 * @author Alexandre Blanchet
 */
"use strict";

/**
 * Implicit frustration Grid Cell
 *
 * @mixes Dispatcher
 */
class Cell {
  /**
   * @param {number} x
   * @param {number} y
   * @param {number} id
   * @param {number} radius
   * @param {Object} draw - Draw class
   * @param {Object} options
   * @param {Object} options.colors
   * @param {Object} options.colors.cell
   * @param {Object} options.colors.target
   * @param {Object} options.colors.cursor
   * @param {Object} options.colors.background
   */
  constructor(x, y, id, radius, draw, options = {}) {
    var default_options = {
      colors: {
        cell: "black",
        target: "red",
        cursor: "red",
        background: "white",
      },
    };
    this.options = merge(default_options, options);

    this.x = x;
    this.y = y;
    this.id = id;
    this.radius = radius;
    this.draw = draw;

    this.is_target = false;
    this.is_cursor = false;

    this.neighbors = [];
    this.rays = new Array(8).fill(null);

    this._init_rays_loc();
  }

  /**
   * Create rays location on the cell
   */
  _init_rays_loc() {
    this.rays_loc = [];
    for (let angle = 0; angle < 2 * Math.PI; angle += Math.PI / 4) {
      let x = this.x + this.radius * Math.cos(angle);
      let y = this.y + this.radius * Math.sin(angle);
      this.rays_loc.push([x, y]);
    }
  }

  /**
   * Show the cell
   */
  show() {
    this.draw.circle(this.x, this.y, this.radius, this.options.colors.cell);
  }

  /**
   * Switch cell from neutral to target or from target to neutral
   */
  switch_target() {
    this.is_target = !this.is_target;
    if (this.is_target) {
      this.draw.circle(this.x, this.y, this.radius, this.options.colors.target);
    } else {
      this.draw.circle(this.x, this.y, this.radius, this.options.colors.cells);
    }
  }

  /**
   * Switch cell from neutral to cursor or from cursor to neutral
   */
  switch_cursor() {
    this.is_cursor = !this.is_cursor;
    if (this.is_cursor) {
      this.draw.circle(
        this.x,
        this.y,
        this.radius * 0.6,
        this.options.colors.cursor,
        true
      );
    } else {
      this.draw.circle(
        this.x,
        this.y,
        this.radius * 0.7,
        this.options.colors.background,
        true
      );
    }
  }
}

/**
 * Implicit frustration Grid Ray
 *
 * @mixes Dispatcher
 */
class Ray {
  /**
   *
   * @param {number} x1
   * @param {number} y1
   * @param {number} x2
   * @param {number} y2
   * @param {Object} draw - Draw class
   * @param {Object} options
   * @param {Object} options.colors
   * @param {Object} options.colors.ray
   * @param {Object} options.colors.background
   */
  constructor(x1, y1, x2, y2, draw, options = {}) {
    var default_options = {
      colors: {
        ray: "black",
        background: "white",
      },
    };
    this.options = merge(default_options, options);

    this.x1 = x1;
    this.y1 = y1;
    this.x2 = x2;
    this.y2 = y2;
    this.draw = draw;
  }

  /**
   * Show the ray
   */
  show() {
    this.draw.line(this.x1, this.y1, this.x2, this.y2, this.options.rays);
  }
}

/**
 * Implicit frustration Grid
 */
class Grid {
  /**
   * @param {Object} options
   * @param {Object} options.parameters - grid parameters
   * @param {number} options.parameters.rows - number of rown
   * @param {number} options.parameters.columns - number of columns
   * @param {number} options.parameters.grid_tx - size that the grid takes in the canvas between 0 and 1
   * @param {number} options.parameters.lines_width - lines width
   * @param {number} options.parameters.canvas_size - canvas size in px
   * @param {Object} options.parameters.element - html canvas location
   * @param {Object} options.colors
   * @param {string} options.colors.background
   * @param {string} options.colors.cell
   * @param {string} options.colors.ray
   * @param {string} options.colors.target
   * @param {string} options.colors.cursor
   * @param {string} options.colors.text
   * @param {string} options.rules
   * @param {string} options.rules.text - rules of the experiment displayed at the beginning
   */
  constructor(options = {}) {
    var default_options = {
      parameters: {
        rows: 4,
        columns: 4,
        grid_tx: 0.9,
        lines_width: 10,
        canvas_size: 700,
        element: document.getElementById("symbols"),
      },
      colors: {
        background: "white",
        cell: "black",
        ray: "black",
        target: "red",
        cursor: "red",
        text: "black",
      },
    };
    this.options = merge(default_options, options);

    this.draw = new Draw(
      this._create_canvas(),
      this.options.parameters.canvas_size,
      this.options.parameters.lines_width
    );
    this.draw.background(this.options.colors.background);
    this.draw.text(this.options.rules.text, this.options.colors.text);
    this.grid_size =
      this.options.parameters.canvas_size * this.options.parameters.grid_tx;
    this.prev_cursor;
  }

  /**
   * Create Canvas in options.parameters.element
   * @returns {Object} Canvas Context
   */
  _create_canvas() {
    var canvas = document.createElement("canvas");
    canvas.id = "canvas";
    canvas.width = this.options.parameters.canvas_size;
    canvas.height = this.options.parameters.canvas_size;

    this.options.parameters.element.appendChild(canvas);

    return canvas.getContext("2d");
  }

  /**
   * Initialize all the elements of the Grid
   */
  init() {
    this._init_cells();
    this._init_neighbors();
    this._init_rays();
  }

  /**
   * Show all the elements of the Grid
   */
  show() {
    this._show_cells();
    this._show_rays();
  }

  /**
   * Clean the elements of the Grid
   */
  clean() {
    this.draw.background(this.options.colors.background);
  }

  /**
   * Create the Cells
   */
  _init_cells() {
    var cell_tx = 1.2;
    var line_tx = 2 - cell_tx;

    if (this.options.parameters.rows < this.options.parameters.columns) {
      var cell_size =
        (this.grid_size / (this.options.parameters.columns * 2 - 1)) * cell_tx;
      var line_size =
        (this.grid_size / (this.options.parameters.columns * 2 - 1)) * line_tx;
    } else {
      var cell_size =
        (this.grid_size / (this.options.parameters.rows * 2 - 1)) * cell_tx;
      var line_size =
        (this.grid_size / (this.options.parameters.rows * 2 - 1)) * line_tx;
    }
    var cell_radius = cell_size / 2;
    var columns_marging =
      (this.options.parameters.canvas_size -
        (this.options.parameters.rows * cell_size +
          (this.options.parameters.rows - 1) * line_size)) /
      2;
    var rows_marging =
      (this.options.parameters.canvas_size -
        (this.options.parameters.columns * cell_size +
          (this.options.parameters.columns - 1) * line_size)) /
      2;

    this.cells = [];
    var id = 0;
    for (
      let x = rows_marging + cell_radius;
      x < this.options.parameters.canvas_size - rows_marging;
      x += cell_size + line_size
    ) {
      for (
        let y = columns_marging + cell_radius;
        y < this.options.parameters.canvas_size - columns_marging;
        y += cell_size + line_size
      ) {
        this.cells.push(
          new Cell(x, y, id, cell_radius, this.draw, this.options)
        );
        id++;
      }
    }
  }

  /**
   * Show the Cells
   */
  _show_cells() {
    this.cells.forEach((cell) => cell.show());
  }

  /**
   * Create the Rays
   */
  _init_rays() {
    this.rays = [];
    this.cells.forEach((cell) => {
      for (let neighbor_i = 0; neighbor_i < 8; neighbor_i++) {
        if (cell.neighbors[neighbor_i]) {
          if (!cell.rays[neighbor_i]) {
            let neighbor_j = (neighbor_i + 4) % 8;
            cell.rays[neighbor_i] = new Ray(
              cell.rays_loc[neighbor_i][0],
              cell.rays_loc[neighbor_i][1],
              cell.neighbors[neighbor_i].rays_loc[neighbor_j][0],
              cell.neighbors[neighbor_i].rays_loc[neighbor_j][1],
              this.draw,
              this.options
            );
            this.rays.push(cell.rays[neighbor_i]);
          }
        }
      }
    });
  }

  /**
   * Show the Rays
   */
  _show_rays() {
    this.rays.forEach((ray) => ray.show());
  }

  _init_neighbors() {
    this.cells.forEach((cell) => {
      let cell_c, cell_r;
      [cell_c, cell_r] = this._cell_pos(cell.id);

      let cell_neighbors = [];
      for (
        let neighbor_c = cell_c - 1;
        neighbor_c <= cell_c + 1;
        neighbor_c++
      ) {
        for (
          let neighbor_r = cell_r - 1;
          neighbor_r <= cell_r + 1;
          neighbor_r++
        ) {
          if (neighbor_c == cell_c && neighbor_r == cell_r) {
          } else if (
            neighbor_c < 0 ||
            neighbor_c >= this.options.parameters.columns ||
            neighbor_r < 0 ||
            neighbor_r >= this.options.parameters.rows
          ) {
            cell_neighbors.push(null);
          } else {
            cell_neighbors.push(
              this.cells[neighbor_c * this.options.parameters.rows + neighbor_r]
            );
          }
        }
      }
      cell.neighbors = [].concat(
        cell_neighbors.slice(6, 8),
        cell_neighbors[4],
        cell_neighbors.slice(0, 3).reverse(),
        cell_neighbors[3],
        cell_neighbors[5]
      );
    });
  }

  _cell_pos(cell_id) {
    return [
      ~~(cell_id / this.options.parameters.rows),
      cell_id % this.options.parameters.rows,
    ];
  }

  is_end() {
    if (this.cursor == this.target) {
      return true;
    } else {
      return false;
    }
  }

  is_closer_to_target() {
    var cursor_dist = Math.sqrt(
      Math.pow(this.cursor.y - this.target.y, 2) +
        Math.pow(this.cursor.x - this.target.x, 2)
    );

    var prev_cursor_dist = Math.sqrt(
      Math.pow(this.prev_cursor.y - this.target.y, 2) +
        Math.pow(this.prev_cursor.x - this.target.x, 2)
    );

    if (cursor_dist < prev_cursor_dist) return true;
    else return false;
  }

  cursor_target_dir() {
    var base_vec = [
      this.prev_cursor.x - this.target.x,
      this.prev_cursor.y - this.target.y,
    ];

    var step_vec = [
      this.prev_cursor.x - this.cursor.x,
      this.prev_cursor.y - this.cursor.y,
    ];

    return Math.round(
      Math.acos(
        (base_vec[0] * step_vec[0] + base_vec[1] * step_vec[1]) /
          (Math.sqrt(Math.pow(base_vec[0], 2) + Math.pow(base_vec[1], 2)) *
            Math.sqrt(Math.pow(step_vec[0], 2) + Math.pow(step_vec[1], 2)))
      ) *
        (180 / Math.PI)
    );
  }

  /**
   * Create cursor and target at a random place
   */
  random_cursor_target() {
    var cells_copy = [...this.cells];
    this.cursor = getRandom(cells_copy);
    cells_copy.splice(cells_copy.indexOf(this.cursor), 1);
    this.target = getRandom(cells_copy);

    this.target.switch_target();
    this.cursor.switch_cursor();
  }

  /**
   * Moves the cursor in a random step
   */
  random_step() {
    this.prev_cursor = this.cursor;
    var neighbors_copy = this.cursor.neighbors.filter(Boolean);
    this.cursor.switch_cursor();
    this.cursor = getRandom(neighbors_copy);
    this.cursor.switch_cursor();
  }
}
