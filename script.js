$(function() {
    (function(window, document, localStorage) {
        const MONTHS_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        const LOCAL_STORAGE_KEY = 'datepicker-plugin';
        const TEMPLATE = `
<div class="datepicker-range">

    <div class="datepicker-calendar datepicker-calendar-start">
        <div class="datepicker-calendar-inner datepicker-panel">
            <div class="datepicker-calendar-header">
                <a href="#" class="datepicker-month-button datepicker-prev-month-button">
                    <span class="datepicker-month-button-text">&#8678</span>
                </a>
                <a href="#" class="datepicker-month-button datepicker-next-month-button">
                    <span class="datepicker-month-button-text">&#8680</span>
                </a>
                <div class="datepicker-month-caption">
                    2016
                </div>
            </div>

            <div class="datepicker-calendar-days">
                <table class="datepicker-days-table">
                    <thead>
                        <tr>
                            <th>Su</th>
                            <th>Mo</th>
                            <th>Tu</th>
                            <th>We</th>
                            <th>Th</th>
                            <th>Fr</th>
                            <th>Sa</th>
                        </tr>
                    </thead>
                    <tbody>
                    </tbody>
                </table>
            </div>
        </div>
    </div>

    <div class="datepicker-calendar datepicker-calendar-finish">
        <div class="datepicker-calendar-inner datepicker-panel">
            <div class="datepicker-calendar-header">
                <a href="#" class="datepicker-month-button datepicker-prev-month-button">
                    <span class="datepicker-month-button-text">&#8678</span>
                </a>
                <a href="#" class="datepicker-month-button datepicker-next-month-button">
                    <span class="datepicker-month-button-text">&#8680</span>
                </a>
                <div class="datepicker-month-caption">
                    2016
                </div>
            </div>

            <div class="datepicker-calendar-days">
                <table class="datepicker-days-table">
                    <thead>
                        <tr>
                            <th>Su</th>
                            <th>Mo</th>
                            <th>Tu</th>
                            <th>We</th>
                            <th>Th</th>
                            <th>Fr</th>
                            <th>Ss</th>
                        </tr>
                    </thead>
                    <tbody>
                    </tbody>
                </table>
            </div>
        </div>
    </div>

    <div class="datepicker-clear"></div>

</div>

<div class="datepicker-warnings">
</div>

<div class="datepicker-options">
</div>

<div class="datepicker-buttons">
    <button class="datepicker-btn-add">Add</button>
    <button class="datepicker-btn-clear">Clear</button>
</div>
        `;


        /**
         * Date range class
         */
        class DateRange {
            constructor(start, finish) {
                if ((!start instanceof Date) || (!finish instanceof Date)) {
                    throw new Error('start and finish in DateRange must be instances of Date');
                }

                this._start = start;
                this._finish = finish;
            }

            getStart() {
                return this._start;
            }

            getFinish() {
                return this._finish;
            }
        }


        /**
         * Date range storage class
         */
        class DateRangeStorage {
            constructor() {
                this._dates = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY));

                if (!this._dates) {
                    this._dates = [];
                } else {
                    this._dates = this._dates.map(date => new DateRange(new Date(date._start), new Date(date._finish)));
                }

                console.log(this._dates);
            }

            getDates() {
                return this._dates;
            }

            add(dateRange) {
                if (!dateRange instanceof DateRange) {
                    throw new Error('dateRange must be instance of DateRange');
                }
                this._dates.push(dateRange);
                this._save();
            }

            clear() {
                this._dates = [];
                this._save();
            }

            _save() {
                console.dir(this._dates);
                localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(this._dates));
            }
        }


        /**
         * Class for handling calendar
         */
        class DatepickerCalendar {
            constructor(storage, selectedRange, $calendarBlock) {
                this._storage = storage;
                this._selectedRange = selectedRange;

                this._$block = $calendarBlock;
                this._$caption = $calendarBlock.find('.datepicker-month-caption');
                this._$days = $calendarBlock.find('.datepicker-days-table tbody');
                this._$prevBtn = $calendarBlock.find('.datepicker-prev-month-button');
                this._$nextBtn = $calendarBlock.find('.datepicker-next-month-button');

                let todayDate = new Date();
                this._year = todayDate.getFullYear();
                this._month = todayDate.getMonth();

                this._todayYear = todayDate.getFullYear();
                this._todayMonth = todayDate.getMonth();
                this._todayDay = todayDate.getDate();
            }

            render() {
                this._$caption.html(MONTHS_NAMES[this._month] + " " + this._year);
                this._$days.empty();

                let $row = $('<tr>');
                let dayOfWeek = (new Date(this._year, this._month, 1)).getDay();

                for (let offset = 0; offset < dayOfWeek; offset++) {
                    $row.append(this._renderEmptyDayCell());
                }

                let daysInMonth = (new Date(this._year, this._month + 1, 0)).getDate();
                for (let day = 1; day <= daysInMonth; day++) {
                    $row.append(this._renderDayCell(day));

                    dayOfWeek++;
                    if (dayOfWeek == 7) {
                        dayOfWeek = 0;
                        this._$days.append($row);

                        if (day !== daysInMonth) {
                            $row = $('<tr>');
                        }
                    }
                }

                if (dayOfWeek > 0) {
                    for (let offset = dayOfWeek; offset < 7; offset++) {
                        $row.append(this._renderEmptyDayCell());
                    }
                    this._$days.append($row);
                }
            }

            registerHandlers() {
                let self = this;

                this._$prevBtn.click(e => {
                    this._month--;
                    if (this._month < 0) {
                        this._month = 11;
                        this._year--;
                    }

                    this.render();
                });

                this._$nextBtn.click(e => {
                    this._month++;
                    if (this._month > 11) {
                        this._month = 0;
                        this._year++;
                    }

                    this.render();
                });

                this._$days.on('click', 'a', function(e) {
                    e.preventDefault();

                    let day = $(this).data('day');
                    self._$block.trigger('datepicker.changeDate', [self._year, self._month, day]);
                });
            }

            _renderEmptyDayCell() {
                return $('<td></td>');
            }

            _isToday(day) {
                return  this._year === this._todayYear
                && this._month === this._todayMonth
                && day === this._todayDay;
            }

            _isInRange(day, range) {
                let date = new Date(this._year, this._month, day);
                range.getStart().setHours(0, 0, 0, 0);
                range.getFinish().setHours(0, 0, 0, 0);

                return date.getTime() >= range.getStart().getTime() && date.getTime() <= range.getFinish().getTime();
            }

            _renderDayCell(day) {
                let $cell = $('<td>');
                let $link = $('<a>' , {href: '#', 'data-day': day, text: day});

                if (this._isToday(day)) {
                    $link.addClass('today');
                }

                this._storage.getDates().forEach(range => {
                    if (this._isInRange(day, range)) {
                        $link.addClass('marked');
                    }
                });

                if (this._isInRange(day, this._selectedRange)) {
                    $link.addClass('selected');
                }

                $cell.append($link);
                return $cell;
            }
        }


        /**
          * Date picker main class
          */
        class Datepicker {
            constructor(storage) {
                this._storage = storage;
                this._$window = null;

                this._startCalendar = null;
                this._$startCalendarBlock = null;
                this._finishCalendar = null;
                this._$finishCalendarBlock = null;

                this._$addBtn = null;
                this._$clearBtn = null;

                this._selectedRange = new DateRange(new Date(), new Date());
            }

            showWindow(posX, posY) {
                if (this._$window === null) {
                    this._renderWindow();
                    this._registerHandlers();
                }

                this._$window.css('left', posX);
                this._$window.css('top', posY);
                this._$window.show();
            }

            hideWindow() {
                if (this._$window !== null) {
                    this._$window.hide();
                }
            }

            _renderWindow() {
                this._$window = $('<div class="datepicker-window"></div>');
                this._$window.html(TEMPLATE);

                this._$startCalendarBlock = this._$window.find('.datepicker-calendar-start');
                this._startCalendar = new DatepickerCalendar(this._storage, this._selectedRange, this._$startCalendarBlock);
                this._startCalendar.render();

                this._$finishCalendarBlock = this._$window.find('.datepicker-calendar-finish');
                this._finishCalendar = new DatepickerCalendar(this._storage, this._selectedRange, this._$finishCalendarBlock);
                this._finishCalendar.render();

                this._$addBtn = this._$window.find('.datepicker-btn-add');
                this._$clearBtn = this._$window.find('.datepicker-btn-clear');

                $('body').append(this._$window);
            }

            _updateCalendars() {
                this._startCalendar.render();
                this._finishCalendar.render();
            }

            _registerHandlers() {
                $(document).click(() => this.hideWindow());
                this._$window.click(e => e.stopPropagation());

                this._startCalendar.registerHandlers();
                this._finishCalendar.registerHandlers();

                this._$startCalendarBlock.on('datepicker.changeDate', (e, year, month, day) => {
                    this._selectedRange.getStart().setFullYear(year, month, day);
                    this._updateCalendars();
                });
                this._$finishCalendarBlock.on('datepicker.changeDate', (e, year, month, day) => {
                    this._selectedRange.getFinish().setFullYear(year, month, day);
                    this._updateCalendars();
                });

                this._$addBtn.click(e => {
                    let resultRange = new DateRange(
                        new Date(this._selectedRange.getStart().getTime()),
                        new Date(this._selectedRange.getFinish().getTime())
                    );

                    this._storage.add(resultRange);
                    this._updateCalendars();
                });

                this._$clearBtn.click(e => {
                    this._storage.clear();
                    this._updateCalendars();
                });
            }
        } 


        /**
         * Date range storage instance
         */
        let dateRangeStorage = null;

        /**
         * Datepicker instance
         */
        let datepicker = null;

        $.fn.datepicker = function() {
            if (dateRangeStorage === null) {
                dateRangeStorage = new DateRangeStorage();
            }

            if (datepicker === null) {
                datepicker = new Datepicker(dateRangeStorage);
            }

            let $this = $(this);
            $this.on('datepicker.show', (e, posX, posY) => datepicker.showWindow(posX, posY));

            return this;
        };
    })(window, document, localStorage);


    $('#target').datepicker().click(function(e) {
        e.stopPropagation();

        $(this).trigger('datepicker.show', '200px', '200px');
    });
});