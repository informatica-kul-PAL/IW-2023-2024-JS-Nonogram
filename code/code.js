const LEVELS = {
    'trivial':
        [[-1,-1,-1, 1, 1],
         [-1,-1, 1, 1,-1],
         [-1, 1, 1,-1,-1],
         [ 1, 1,-1,-1,-1],
         [ 1, 1, 1, 1, 1]],
    'easy':
        [[-1,-1,-1, 1,-1, 1,-1,-1,-1 ,-1],
         [ 1, 1,-1, 1,-1, 1,-1, 1, 1 ,-1],
         [-1, 1, 1, 1, 1, 1, 1, 1,-1 ,-1],
         [-1,-1, 1,-1, 1, 1, 1,-1,-1 ,-1],
         [-1,-1, 1, 1, 1, 1, 1, 1,-1 ,-1],
         [-1,-1, 1, 1, 1, 1, 1, 1, 1 ,-1],
         [-1,-1, 1, 1, 1, 1, 1, 1, 1 , 1],
         [-1,-1, 1, 1, 1, 1, 1, 1, 1 , 1],
         [-1,-1, 1, 1, 1, 1, 1, 1, 1 , 1],
         [-1,-1, 1, 1, 1, 1,-1,-1,-1 ,-1]],
    'intermediate':
        [[-1,-1, 1,-1,-1,-1,-1, 1,-1,-1],
         [-1, 1, 1, 1,-1,-1, 1, 1, 1,-1],
         [ 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
         [ 1, 1,-1,-1, 1,-1,-1, 1, 1, 1],
         [ 1, 1,-1,-1,-1,-1,-1, 1, 1, 1],
         [ 1, 1,-1,-1,-1,-1, 1, 1, 1, 1],
         [-1, 1, 1,-1,-1, 1, 1, 1, 1,-1],
         [-1,-1, 1, 1, 1, 1, 1, 1,-1,-1],
         [-1,-1,-1, 1, 1, 1, 1,-1,-1,-1],
         [-1,-1,-1,-1, 1, 1,-1,-1,-1,-1]],
    'hard':         
        [[-1,-1,-1,-1,-1,-1, 1, 1, 1, 1, 1,-1,-1,-1,-1],
         [-1,-1,-1,-1,-1, 1, 1, 1,-1,-1, 1, 1,-1,-1,-1],
         [-1,-1,-1,-1, 1, 1, 1, 1, 1,-1,-1,-1,-1,-1,-1],
         [-1,-1,-1,-1, 1, 1, 1, 1, 1, 1,-1,-1,-1, 1,-1],
         [-1,-1, 1,-1,-1, 1, 1,-1,-1,-1,-1,-1,-1, 1, 1],
         [-1,-1, 1, 1,-1,-1, 1,-1, 1,-1,-1, 1,-1,-1, 1],
         [-1, 1,-1,-1, 1,-1, 1, 1, 1, 1,-1, 1, 1,-1, 1],
         [-1,-1, 1, 1, 1, 1, 1, 1, 1,-1,-1, 1, 1, 1, 1],
         [-1, 1,-1,-1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
         [-1,-1, 1, 1, 1, 1, 1, 1,-1,-1, 1, 1, 1, 1,-1],
         [-1,-1,-1, 1, 1, 1, 1, 1, 1,-1,-1, 1, 1,-1,-1],
         [ 1, 1, 1, 1, 1, 1,-1, 1,-1, 1,-1,-1,-1,-1,-1],
         [ 1, 1, 1, 1,-1, 1,-1, 1,-1, 1, 1,-1,-1,-1,-1],
         [-1, 1, 1, 1,-1,-1, 1,-1, 1,-1,-1,-1,-1,-1,-1],
         [-1,-1, 1, 1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1]],
};

let game;
let timer;



class Nonogram {
    field;
    solution;
    lives = 3;
    click_count = 0;

    timeout_id = -1;

    constructor(level_name) {
        this.level_name = level_name;
        this.solution = LEVELS[level_name];
        this.field = Array(this.height)
            .fill(null)
            .map(() => Array(this.width).fill(0));
        this.draw_all();
        this.hide_pop_up();
    }

    get height() {
        return this.solution.length;
    }

    get width() {
        return this.solution[0].length;
    }

    draw_all() {
        this.draw_field();
        this.draw_lives();
        this.draw_indicators();
    }

    draw_lives() {
        document.getElementById('lives').innerHTML = '<div class="live"></div>'.repeat(this.lives);
    }

    draw_field() {
        document.getElementById('field').innerHTML = `<tbody>${this.field.map(row => this.field_row_html(row)).join('')}</tbody>`;
    }

    field_row_html(row) {
        return `<tr>${row.map(value => this.field_value_html(value)).join('')}</tr>`;
    }

    field_value_html(value) {
        switch (value) {
            case -1: return `<td class="checked"></td>`;
            case 1: return `<td class="filled"></td>`;
            default: return `<td onclick="game.on_click(this, 1)" oncontextmenu="game.on_click(this, -1); return false;"></td>`;
        }
    }

    draw_indicators() {
        const left_indicators = this.calculate_indicators(this.solution);
        const transposed_top_indicators = this.calculate_indicators(this.sol_columns);
        const padded_left_indicators = this.pad_indicators(left_indicators);
        const padded_transposed_top_indicators = this.pad_indicators(transposed_top_indicators);
        const padded_top_indicators = padded_transposed_top_indicators[0].map((col, i) => padded_transposed_top_indicators.map(row => row[i]));
        document.getElementById('indicator_left').innerHTML = this.indicators_html(padded_left_indicators);
        document.getElementById('indicator_upper').innerHTML = this.indicators_html(padded_top_indicators);
    }

    pad_indicators(indicators) {
        const size = Math.max(...indicators.map(indicator => indicator.length));
        const padding = Array(size).fill('');
        return indicators.map(indicator => padding.slice(indicator.length).concat(indicator));
    }

    calculate_indicators(lines) {
        return lines.map((line) => this.calculate_line_indicator(line));
    }

    calculate_line_indicator(line) {
        const indicator = line.reduce((res, value) => {
            if (value === 1)
                res[res.length - 1]++;
            else if (res[res.length - 1] !== 0)
                res.push(0);
            return res;
        }, [0]).filter((value) => value !== 0);
        if (indicator.length === 0) return [0];
        return indicator;
    }

    indicators_html(indicators) {
        return `<tbody>${indicators.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('')}</tbody>`;
    }

    on_click(cell, type) {
        if (this.lives === 0) return;
        this.click_count++;
        const row = cell.parentNode.rowIndex;
        const column = cell.cellIndex;
        
        if (type !== this.solution[row][column]) {
            this.lives--;
            if (this.lives > 0) {
                this.show_pop_up("You've lost a life...");
            } else {
                this.show_pop_up("GAME OVER", 'red', -1);
            }
            this.draw_lives();
        }

        this.field[row][column] = this.solution[row][column];
        this.attempt_to_finish_row(row);
        this.attempt_to_finish_column(column);
        this.draw_field();
        // this.draw_click_count();

        if (this.is_won()) {
            this.show_pop_up("YOU'VE WON", 'steelblue', -1);
        }
    }

    attempt_to_finish_row(index) {
        const sol_row = this.sol_row(index);
        if (this.row(index).every((value, column_index) => value >= sol_row[column_index])) {
            this.set_row(index, sol_row);
        }
    }

    attempt_to_finish_column(index) {
        const sol_column = this.sol_column(index);
        if (this.column(index).every((value, row_index) => value >= sol_column[row_index])) {
            this.set_column(index, sol_column);
        }
    }

    row(index) {
        return this.field[index];
    }

    column(index) {
        return this.field.map(row => row[index]);
    }

    sol_row(index) {
        return this.solution[index];
    }

    sol_column(index) {
        return this.solution.map(row => row[index]);
    }

    get sol_columns() {
        return [...Array(this.width).keys()].map((index) => this.sol_column(index));
    }

    set_row(index, row) {
        this.field[index] = row;
    }

    set_column(index, column) {
        this.field.map((row, row_index) => row[index] = column[row_index]);
    }

    show_pop_up(text, colour = 'red', duration = 1000) {
        document.getElementById('field_wrapper').dataset.headsUp = text;
        document.getElementById('field_wrapper').dataset.colour = colour;
        document.getElementById('field_wrapper').classList.add('pop_up');
        clearTimeout(this.timeout_id);
        if (duration > 0) {
            this.timeout_id = setTimeout(() => this.hide_pop_up(), duration);
        }
    }

    hide_pop_up() {
        document.getElementById('field_wrapper').classList.remove('pop_up');
    }

    is_won() {
        return this.field.every((row, row_index) => {
            return row.every((value, column_index) => value === this.solution[row_index][column_index]);
        });
    }
}

window.onload = (_event) => {
    game = new Nonogram('trivial');
};