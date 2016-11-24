$(function() {
    (function() {
        /**
         * Hide time for warnings
         */
        var HIDE_TIME = 2000;

        /**
         * Months names
         */
        var MONTHS_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

        /**
         * Key for local storage to store data
         */
        var LOCAL_STORAGE_KEY = 'datepicker-plugin';

        /**
         * Window template
         */
        var TEMPLATE = $('#template').html();


        /**
         * Date range type template
         */
        var TYPE_TEMPLATE = $('#type-template').html();

        /**
         * Date range type class
         * Constructor
         *
         * @param {string} value
         * @param {string} classstring
         * @param {string} description
         */
        function DatepickerRangeType(value, classstring, description) {
            this._value = value;
            this._class = classstring;
            this._description = description;
        }

        DatepickerRangeType.prototype.getValue = function() {
            return this._value;
        };

        DatepickerRangeType.prototype.getClass = function() {
            return this._class;
        };

        DatepickerRangeType.prototype.getDescription = function() {
            return this._description;
        };


        /**
         * Date range type storage class
         */
        function DatepickerRangeTypeStorage() {
            this._types = Object.create(null, {});
            this._first = null;
        }

        DatepickerRangeTypeStorage.prototype.add = function(type) {
            if (!(type instanceof DatepickerRangeType)) {
                throw new Error('type must be instance of DatepickerRangeType');
            }

            this._types[type.getValue()] = type;
            if (this._first === null) {
                this._first = type;
            }
        };

        DatepickerRangeTypeStorage.prototype.get = function(value) {
            if (!(value in this._types)) {
                throw new Error('Missing date range type');
            }

            return this._types[value];
        };

        DatepickerRangeTypeStorage.prototype.iterate = function(callback) {
            for (var value in this._types) {
                callback(this._types[value]);
            }
        };

        DatepickerRangeTypeStorage.prototype.getFirst = function() {
            return this._first;
        };


        /**
         * Date range class
         */
        function DatepickerRange(start, finish, type) {
            if (!(start instanceof Date) || !(finish instanceof Date)) {
                throw new Error('start and finish in DatepickerRange must be instances of Date');
            }

            this._start = start;
            this._finish = finish;

            this._start.setHours(0, 0, 0, 0);
            this._finish.setHours(0, 0, 0, 0);

            this.setType(type);
        }

        DatepickerRange.prototype.getStart = function() {
            return this._start;
        };

        DatepickerRange.prototype.getFinish = function() {
            return this._finish;
        };

        DatepickerRange.prototype.getType = function() {
            return this._type;
        };

        DatepickerRange.prototype.setType = function(type) {
            if (!(type instanceof DatepickerRangeType)) {
                throw new Error('type must be instance of DatepickerRangeType');
            }

            this._type = type;
        };

        DatepickerRange.prototype.isIntersect = function(range) {
            if (!(range instanceof DatepickerRange)) {
                throw new Error('range must be instance of DatepickerRange');
            }

            var left = this._start.getTime(),
                right = this._finish.getTime();

            left = Math.max(left, range.getStart().getTime());
            right = Math.min(right, range.getFinish().getTime());

            return right >= left;
        };


        /**
         * Date range storage class
         * Stores all data in localstorage
         */
        function DatepickerRangeStorage(typeStorage) {
            this._dates = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY));

            if (!(typeStorage instanceof DatepickerRangeTypeStorage)) {
                throw new Error('typeStorage must be instance of DatepickerRangeTypeStorage');
            }
            this._typeStorage = typeStorage;

            if (!this._dates) {
                this._dates = [];
            } else {
                this._dates = this._dates.map((function(date) {
                    return new DatepickerRange(new Date(date.start), new Date(date.finish), this._typeStorage.get(date.type));
                }).bind(this));
            }
        }

        DatepickerRangeStorage.prototype.getDates = function() {
            return this._dates;
        };

        DatepickerRangeStorage.prototype.add = function(datepickerRange) {
            if (!(datepickerRange instanceof DatepickerRange)) {
                throw new Error('datepickerRange must be instance of DatepickerRange');
            }
            this._dates.push(datepickerRange);
            this._save();
        };

        DatepickerRangeStorage.prototype.clear = function() {
            this._dates = [];
            this._save();
        };

        DatepickerRangeStorage.prototype._save = function() {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(this._dates.map(function(date) {
                return {
                    start: date.getStart(),
                    finish: date.getFinish(),
                    type: date.getType().getValue()
                };
            })));
        };


        /**
         * Class for handling calendar
         * Constructor
         *
         * @param {DatepickerRangeStorage} rangeStorage - It is used for displaying added ranges
         * @param {DatepickerRangeTypeStorage} typeStorage - It is used for retrieving types classes
         * @param {DatepickerRange} selectedRange - Instance of selected range from datepicker
         * @param {Object} $calendarBlock - jQuery object of block with calendar
         */

        function DatepickerCalendar(rangeStorage, typeStorage, selectedRange, $calendarBlock) {
            if (!(rangeStorage instanceof DatepickerRangeStorage)) {
                throw new Error('rangeStorage must be instance of DatepickerRangeStorage');
            }
            this._rangeStorage = rangeStorage;

            if (!(typeStorage instanceof DatepickerRangeTypeStorage)) {
                throw new Error('typeStorage must be instance of DatepickerRangeTypeStorage');
            }
            this._typeStorage = typeStorage;

            if (!(selectedRange instanceof DatepickerRange)) {
                throw new Error('selectedRange must be instance of DatepickerRange');
            }
            this._selectedRange = selectedRange;

            this._$caption = $calendarBlock.find('.datepicker-month-caption');
            this._$days = $calendarBlock.find('.datepicker-days-table tbody');
            this._$prevBtn = $calendarBlock.find('.datepicker-prev-month-button');
            this._$nextBtn = $calendarBlock.find('.datepicker-next-month-button');

            var todayDate = new Date();
            this._year = todayDate.getFullYear();
            this._month = todayDate.getMonth();

            this._todayYear = todayDate.getFullYear();
            this._todayMonth = todayDate.getMonth();
            this._todayDay = todayDate.getDate();

            this._changeCallback = null;
        }

        /**
         * Render caption and days table
         */
        DatepickerCalendar.prototype.render = function() {
            this._$caption.html(MONTHS_NAMES[this._month] + " " + this._year);
            this._$days.empty();

            var $row = $('<tr>'),
                dayOfWeek = (new Date(this._year, this._month, 1)).getDay(),
                offset;

            for (offset = 0; offset < dayOfWeek; offset++) {
                $row.append(this._renderEmptyDayCell());
            }

            var daysInMonth = (new Date(this._year, this._month + 1, 0)).getDate();
            for (var day = 1; day <= daysInMonth; day++) {
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
                for (offset = dayOfWeek; offset < 7; offset++) {
                    $row.append(this._renderEmptyDayCell());
                }
                this._$days.append($row);
            }
        };

        /**
         * Register user handles
         */
        DatepickerCalendar.prototype.registerHandlers = function() {
            var self = this;

            this._$prevBtn.click(function(e) {
                self._month--;
                if (self._month < 0) {
                    self._month = 11;
                    self._year--;
                }

                self.render();
            });

            this._$nextBtn.click(function(e) {
                self._month++;
                if (self._month > 11) {
                    self._month = 0;
                    self._year++;
                }

                self.render();
            });

            this._$days.on('click', 'a', function(e) {
                e.preventDefault();

                if (self._changeCallback) {
                    self._changeCallback(self._year, self._month, $(this).data('day'));
                }
            });
        };

        /**
         * Allows calling function after day has been selected
         *
         * @param {Function} fn
         */
        DatepickerCalendar.prototype.setChangeCallback = function(fn) {
            if (!(fn instanceof Function)) {
                throw new Error('type change callback must be instance of Function');
            }

            this._changeCallback = fn;
        };

        /**
         * Render empty single day cell
         *
         * @return {Object}
         */
        DatepickerCalendar.prototype._renderEmptyDayCell = function() {
            return $('<td></td>');
        };

        /**
         * Is rendering day is today
         *
         * @param {number} day
         * @return {boolean}
         */
        DatepickerCalendar.prototype._isToday = function(day) {
            return  this._year === this._todayYear && this._month === this._todayMonth && day === this._todayDay;
        };

        /**
         * Is rendering day is in range
         *
         * @param {number} day
         * @param {DatepickerRange} range
         * @return {boolean}
         */
        DatepickerCalendar.prototype._isInRange = function(day, range) {
            var date = new Date(this._year, this._month, day);

            return date.getTime() >= range.getStart().getTime() && date.getTime() <= range.getFinish().getTime();
        };

        /**
         * Is rendering day is the point of range
         *
         * @param {number} day
         * @param {DatepickerRange} range
         * @return {boolean}
         */
        DatepickerCalendar.prototype._isMarked = function(day, range) {
            var date = new Date(this._year, this._month, day);

            return date.getTime() === range.getStart().getTime() || date.getTime() === range.getFinish().getTime();
        };

        /**
         * Render single day cell
         *
         * @param {number} day
         * @return {Object}
         */
        DatepickerCalendar.prototype._renderDayCell = function(day) {
            var $cell = $('<td>'),
                $link = $('<a>' , {href: '#', 'data-day': day, text: day}),
                self = this;

            if (this._isToday(day)) {
                $link.addClass('today');
            }

            this._rangeStorage.getDates().forEach(function(range) {
                if (self._isInRange(day, range)) {
                    $link.addClass(range.getType().getClass());
                }
            });

            if (this._isMarked(day, this._selectedRange)) {
                $link.addClass('marked');
            }

            if (this._isInRange(day, this._selectedRange)) {
                $link.addClass('selected');
            }

            $cell.append($link);
            return $cell;
        };


        /**
          * Date picker main class
          * Constructor
         *
         * @param {DatepickerRangeStorage} rangeStorage
         * @param {DatepickerRangeTypeStorage} typeStorage
         */            
        function Datepicker(rangeStorage, typeStorage) {
            if (!(rangeStorage instanceof DatepickerRangeStorage)) {
                throw new Error('rangeStorage must be instance of DatepickerRangeStorage');
            }
            this._rangeStorage = rangeStorage;

            if (!(typeStorage instanceof DatepickerRangeTypeStorage)) {
                throw new Error('typeStorage must be instance of DatepickerRangeStorage');
            }
            this._typeStorage = typeStorage;

            this._$window = null;

            this._startCalendar = null;
            this._finishCalendar = null;

            this._$typesBlock = null;

            this._$addBtn = null;
            this._$clearBtn = null;

            this._$success = null;
            this._$cleared = null;
            this._$warning = null;
            this._$override = null;

            this._selectedRange = new DatepickerRange(new Date(), new Date(), this._typeStorage.getFirst());
        }

        /**
         * Display window
         *
         * @param {number} posX
         * @param {number} posY
         */
        Datepicker.prototype.showWindow = function(posX, posY) {
            if (this._$window === null) {
                this._renderWindow();
                this._registerHandlers();
            }

            this._$window.css('left', posX);
            this._$window.css('top', posY);
            this._$window.show();
        };

        /**
         * Hide window
         */
        Datepicker.prototype.hideWindow = function() {
            if (this._$window !== null) {
                this._$window.hide();
            }
        };

        /**
         * Render window
         */
        Datepicker.prototype._renderWindow = function() {
            this._$window = $('<div class="datepicker-window"></div>');
            this._$window.html(TEMPLATE);

            this._renderTypes();

            this._$success = this._$window.find('.datepicker-success');
            this._$cleared = this._$window.find('.datepicker-cleared');
            this._$intersect = this._$window.find('.datepicker-intersect');
            this._$override = this._$window.find('.datepicker-override input');

            this._startCalendar = new DatepickerCalendar(this._rangeStorage, this._typeStorage, this._selectedRange, this._$window.find('.datepicker-calendar-start'));
            this._finishCalendar = new DatepickerCalendar(this._rangeStorage, this._typeStorage, this._selectedRange, this._$window.find('.datepicker-calendar-finish'));
            this._renderCalendars();

            this._$addBtn = this._$window.find('.datepicker-btn-add');
            this._$clearBtn = this._$window.find('.datepicker-btn-clear');

            $('body').append(this._$window);
        };

        /**
         * Render types selection
         */
        Datepicker.prototype._renderTypes = function() {
            this._$typesBlock = this._$window.find('.datepicker-options');

            this._typeStorage.iterate((function(type) {
                var row = $(TYPE_TEMPLATE),
                    $input = row.find('input');
                $input.data('type', type.getValue());

                if (type == this._selectedRange.getType()) {
                    $input.prop('checked', true);
                }
                row.find('.datepicker-type-text').html(type.getDescription());

                this._$typesBlock.append(row);
            }).bind(this)) ;
        };

        /**
         * Render calendars and intersection warning
         */
        Datepicker.prototype._renderCalendars = function() {
            this._startCalendar.render();
            this._finishCalendar.render();

            this._$intersect.toggle(this._isSelectedRangeIntersect());
        };

        /**
         * Register handlers
         */
        Datepicker.prototype._registerHandlers = function() {
            var self = this;

            $(document).click(function() {
                self.hideWindow();
            });
            this._$window.click(function(e) {
                e.stopPropagation();
            });

            this._startCalendar.registerHandlers();
            this._finishCalendar.registerHandlers();

            this._startCalendar.setChangeCallback((function (year, month, day) {
                this._selectedRange.getStart().setFullYear(year, month, day);
                this._renderCalendars();
            }).bind(this));
            this._finishCalendar.setChangeCallback((function(year, month, day) {
                this._selectedRange.getFinish().setFullYear(year, month, day);
                this._renderCalendars();
            }).bind(this));

            this._$addBtn.click((function(e) {
                if (this._selectedRange.getStart().getTime() > this._selectedRange.getFinish().getTime()) {
                    return;
                }

                if (this._$override.prop('checked') === true || !this._isSelectedRangeIntersect()) {
                    var resultRange = new DatepickerRange(
                        new Date(this._selectedRange.getStart().getTime()),
                        new Date(this._selectedRange.getFinish().getTime()),
                        this._selectedRange.getType()
                    );

                    this._rangeStorage.add(resultRange);
                    this._renderCalendars();

                    this._$success.show();
                    this._$success.hide(HIDE_TIME);
                }
            }).bind(this)) ;

            this._$clearBtn.click((function(e) {
                this._rangeStorage.clear();
                this._renderCalendars();

                this._$cleared.show();
                this._$cleared.hide(HIDE_TIME);
            }).bind(this));

            this._$typesBlock.on('change', 'input', function() {
                self._selectedRange.setType(self._typeStorage.get($(this).data('type')));
            });
        };

        /**
         * Is selected range intersecting added ranges
         *
         * @return {boolean}
         */
        Datepicker.prototype._isSelectedRangeIntersect = function() {
            var isIntersect = false,
                self = this;

            this._rangeStorage.getDates().forEach(function(range) {
                if (self._selectedRange.isIntersect(range)) {
                    isIntersect = true;
                }
            });

            return isIntersect;
        };


        /**
         * Date range type storage instance
         * @var {DatepickerRangeTypeStorage}
         */
        var datepickerRangeTypeStorage = new DatepickerRangeTypeStorage();
        [
            new DatepickerRangeType(1, 'range-1', 'Reminder'),
            new DatepickerRangeType(2, 'range-2', 'Meeting'),
            new DatepickerRangeType(3, 'range-3', 'Appointment'),
        ].forEach(function(v) {
            datepickerRangeTypeStorage.add(v);
        });

        /**
         * Date range storage instance
         * @var {DatepickerRangeStorage}
         */
        var datepickerRangeStorage = null;

        /**
         * Datepicker instance
         * @var {Datepicker}
         */
        var datepicker = null;

        /*
         * Plugin
         */
        $.fn.datepicker = function() {
            if (datepickerRangeStorage === null) {
                datepickerRangeStorage = new DatepickerRangeStorage(datepickerRangeTypeStorage);
            }

            if (datepicker === null) {
                datepicker = new Datepicker(datepickerRangeStorage, datepickerRangeTypeStorage);
            }

            $(this).each(function() {
                var $this = $(this);
                $this.on('datepicker.show', function(e, posX, posY) {
                    datepicker.showWindow(posX, posY);
                });
            });

            return this;
        };
    })();

    /*
     * Usage
     */
    $('#target').datepicker().click(function(e) {
        e.stopPropagation();

        $(this).trigger('datepicker.show', '200px', '200px');
    });
});