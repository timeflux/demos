/**
 * @file Utils - Implicit Frustration UI
 * @author Alexandre Blanchet
 */
"use strict";

/**
 *
 * @param {list} keys list of list of keys that the user can press
 * @returns Return the key pressed
 */
function waitingKeypress(keys) {
  return new Promise((resolve) => {
    document.addEventListener("keydown", onKeyHandler);
    function onKeyHandler(e) {
      if (keys.includes(e.key)) {
        document.removeEventListener("keydown", onKeyHandler);
        resolve(e.key);
      }
    }
  });
}

/**
 * Return random element of the list
 * @param {list} lst
 * @returns Random element
 */
function getRandom(lst) {
  return lst[Math.floor(Math.random() * lst.length)];
}

/**
 * Draw for Implicit frustration
 *
 * @mixes Dispatcher
 */
class Draw {
  /**
   *
   * @param {Object} ctx Canvas Context
   * @param {number} canvas_size
   * @param {number} lines_width
   */
  constructor(ctx, canvas_size, lines_width) {
    this.ctx = ctx;
    this.canvas_size = canvas_size;
    this.lines_width = lines_width;
  }

  /**
   * Draw circle
   * @param {number} x
   * @param {number} y
   * @param {number} r circle radius
   * @param {sting} color
   * @param {boolean} fill
   */
  circle(x, y, r, color, fill = false) {
    console.log(color);
    this.ctx.beginPath();
    this.ctx.arc(x, y, r, 0, 2 * Math.PI);
    if (fill) {
      this.ctx.fillStyle = color;
      this.ctx.fill();
    }
    this.ctx.lineWidth = this.lines_width;
    this.ctx.strokeStyle = color;
    this.ctx.stroke();
  }

  /**
   * Draw line
   * @param {number} x1
   * @param {number} y1
   * @param {number} x2
   * @param {number} y2
   * @param {string} color
   */
  line(x1, y1, x2, y2, color) {
    this.ctx.beginPath();
    this.ctx.strokeStyle = color;
    this.ctx.moveTo(x1, y1);
    this.ctx.lineTo(x2, y2);
    this.ctx.lineWidth = this.lines_width;
    this.ctx.stroke();
  }

  /**
   * Set background color
   * @param {string} color
   */
  background(color) {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(0, 0, this.canvas_size, this.canvas_size);
  }

  /**
   * Write text
   * @param {string} text
   * @param {string} color
   */
  text(text, color) {
    var lines = text.split("\n");
    this.ctx.fillStyle = color;
    this.ctx.font = "20px serif";

    for (var i = 0; i < lines.length; i++) {
      this.ctx.fillText(lines[i], 0, 100 + i * 40);
    }
  }
}
