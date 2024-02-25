(function()
{  
  function extend(o1, o2)
  {
      for( var key in o2 )
          if( o2.hasOwnProperty(key) )
              o1[key] = o2[key];
  };
      
  this.MultiRange = function MultiRange( placeholderElm, settings )
  {
      settings = typeof settings == 'object' ? settings : {};
  
      // Устанавливаем настройки по умолчания для слайдера
      this.settings = {

          // Минимальный размер диапазона
          minRange   : typeof settings.minRange == 'number' ? settings.minRange : 1,
          // Шаг делений
          tickStep   : settings.tickStep || 5,
          // Размер шага
          step       : typeof settings.step == 'number' ? settings.step : 1,
          scale      : 100,
          // Максимальное и минимальное значения
          min        : settings.min || 2000,
          max        : settings.max || 2024,
      }
      
      // Расстояние между максимальным и минимальным значениями
      this.delta = this.settings.max - this.settings.min;
      
      // Вычесляем шаг делений, если пользователь указал количество делений
      if( settings.ticks )
          this.settings.tickStep = this.delta / settings.ticks;
  
      // Массив из первоначальных значений слайдера
      this.ranges = settings.ranges || [
          this.settings.min + this.settings.tickStep, 
          this.settings.max - this.settings.tickStep
      ]
  
      //this.id = Math.random().toString(36).substr(2,9),
      // Создаем пустой объект для ссылок
      this.DOM = {};  
      
      // Добавляем свойства из EventDispatcher в MultiRange
      extend(this, new this.EventDispatcher());

      // Вызываем методы build и events.binding.call
      this.build(placeholderElm);
      this.events.binding.call(this);
  }
  
  MultiRange.prototype = {
      build : function( placeholderElm )
      {
          // Создаем изменяемую переменную  
          var that = this,
              // Если класс multiRange отсутствует, то добавляем multiRange, иначе оставляем все как есть
              scopeClasses = placeholderElm.className.indexOf('multiRange') == -1 ? 
                              'multiRange ' + placeholderElm.className : 
                              placeholderElm.className; 
  
          // Создаем новый элемент div с классом multiRange
          this.DOM.scope = document.createElement('div');
          this.DOM.scope.className = scopeClasses;
        

          // Создаем новый элемент div с классом multiRange__rangeWrap
          this.DOM.rangeWrap = document.createElement('div');
          this.DOM.rangeWrap.className = 'multiRange__rangeWrap';
          this.DOM.rangeWrap.innerHTML = this.getRangesHTML();
  
          // Создаем новый элемент div с классом multiRange__ticks
          this.DOM.ticks = document.createElement('div');
          this.DOM.ticks.className = 'multiRange__ticks';
          this.DOM.ticks.innerHTML = this.generateTicks();
  
          // Добавление элементов rangeWrap и ticks в DOM.scope
          this.DOM.scope.appendChild(this.DOM.rangeWrap);
          this.DOM.scope.appendChild(this.DOM.ticks);
  
          // Заменяем исходный элемент (компонент multiRange) на DOM.scope
          placeholderElm.parentNode.replaceChild(this.DOM.scope, placeholderElm);
      },
  

      // Генерация делений
      generateTicks: function() {
        var HTML = '';
        var isSecondSlider = this.DOM.scope.classList.contains('type1');
        
        if (isSecondSlider) {
            var steps = (this.delta) / this.settings.tickStep;
            var months = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
            for (var i = 0; i <= steps; i++) {
                var monthIndex = i % 12;
                var value = new Date(this.settings.min + this.settings.tickStep * i);
                HTML += '<div class="month">' + months[monthIndex] + '</div>';
            }
        } else {
            // Генерация черточек с числами для первого слайдера
            var steps = (this.delta) / this.settings.tickStep;
            for (var i = 0; i <= steps; i++) {
                var value = (+this.settings.min) + this.settings.tickStep * i;
                value = value.toFixed(1).replace('.0', '');
                HTML += '<div data-value="' + value + '"></div>';
            }
        }
        
        return HTML;
    },
      
      // генерация ползунков
      getRangesHTML()
      {
          var that = this,
              rangesHTML = '',
              ranges;
          
          // Добавляем нулевой элемент в начале массива
          this.ranges.unshift(0)

          // Если последний элемент массива меньше максимального значения, то добавляется максимальное значение в массив
          if( this.ranges[this.ranges.length - 1] < this.settings.max )
              this.ranges.push(this.settings.max);
          
          ranges = this.ranges;
        
          ranges.forEach(function(range, i)
          {
              // Если i равно длине массива (то есть последний элемент), то прерываем операцию
              if( i == ranges.length - 1 ) return;
              
              // Вычисляем левую поицию
              var leftPos = (range - that.settings.min) / (that.delta) * 100;
              
              // Предотвращение ошибки при отрицательном значении
              if( leftPos < 0 )
                  leftPos = 0;
  
              // Использую округление, но она почему-то не применяется
              var round = Math.floor(range);

                           
              rangesHTML += '<div data-idx="'+i+'" class="multiRange__range" \
                  style="left:'+ leftPos +'%">\
                  <div class="multiRange__handle">\
                    <div class="multiRange__handle__value">'+ round +'</div>\
                  </div>\
              </div>';         
          })
          
          return rangesHTML;
      },
      
      // Определяем конструктор
      EventDispatcher : function(){
          
          // Создаем узел текста DOM
          var target = document.createTextNode('');
  
          // Метод для удаления слушателя событий
          this.off = target.removeEventListener.bind(target);

          // Метод для добавления слушателя событий
          this.on = target.addEventListener.bind(target);

          // Метод для вызова события
          this.trigger = function(eventName, data)
          {
              if( !eventName ) return;
              var e = new CustomEvent(eventName, {"detail":data});
              target.dispatchEvent(e);
          }
      },



      events : {
          binding : function()
          {
              // Добавляем событие mousedown к элементу rangeWrap
              this.DOM.rangeWrap.addEventListener('mousedown', this.events.callbacks.onMouseDown.bind(this))
              
              // Добавляем событие dragstart к элементу scope
              this.DOM.scope.addEventListener("dragstart", function(e){ return false });              
          },

          // Обработчик события onMouseDown
          callbacks : {
              onMouseDown : function(e)
              {
                  // Получаем элемент на котором произошло событие
                  var target = e.target;

                  if( !target ) return;
                  
                  if( target.className == 'multiRange__handle__value' )
                      target = target.parentNode;
                  
                  else if( target.className != 'multiRange__handle' )
                      return;
                  
                  // Получаем размеры DOM.scope
                  var _BCR = this.DOM.scope.getBoundingClientRect();

                  // Сохраняем левую границу и ширину
                  this.offsetLeft = _BCR.left;
                  this.scopeWidth = _BCR.width;

                  // Сохраняем в currentSlice значение родительского элемента (range)
                  this.DOM.currentSlice = target.parentNode;
                  
                  // Добавляем класс grabbed
                  this.DOM.currentSlice.classList.add('grabbed');

                  // Находим значение .multiRange__handle__value
                  this.DOM.currentSliceValue = this.DOM.currentSlice.querySelector('.multiRange__handle__value');
                  
                  // Добавляем класс multiRange-grabbing
                  document.body.classList.add('multiRange-grabbing');
                  
                  // Создаем две функции-обработчика 
                  this.events.onMouseUpFunc = this.events.callbacks.onMouseUp.bind(this);
                  this.events.mousemoveFunc = this.events.callbacks.onMouseMove.bind(this);
  
                  // События добавляются как слушатели, то есть если возникнет событие 'mouseup', то будет вызван onMouseUpFunc
                  window.addEventListener('mouseup', this.events.onMouseUpFunc)
                  window.addEventListener('mousemove', this.events.mousemoveFunc)
              },
  
              onMouseUp : function(e)
              {
                  // Удаляем класс grabbed
                  this.DOM.currentSlice.classList.remove('grabbed');

                  // Удаляем обработчики событий mousemove и mouseup
                  window.removeEventListener('mousemove', this.events.mousemoveFunc);
                  window.removeEventListener('mouseup', this.events.onMouseUpFunc);

                  // Удаляем класс multiRange-grabbing
                  document.body.classList.remove('multiRange-grabbing');
     
                  // извлекаем значение свойства left
                  var value = parseInt( this.DOM.currentSlice.style.left );

                  // Создаем событие (которое передает данные: id текущего ползунка, текущее значение ползунка, массив ranges )
                  this.trigger('changed', {idx:+this.DOM.currentSlice.dataset.idx, value:value, ranges:this.ranges})
                  
                  // Очищаем ссылку this.DOM.currentSlice, чтобы избежать утечек памяти
                  this.DOM.currentSlice = null;
              },
  
              onMouseMove : function(e)
              {
                  // Если пользователь опустил мышку и перемещение ползунка завершено
                  if( !this.DOM.currentSlice )
                  {
                      // Удаляем обработчик событий 'mouseup'
                      window.removeEventListener('mouseup', this.events.onMouseUpFunc);
                      return;
                  }
                  
                  // Проверяем, находится ли текущее положение мыши в пределах области, где разрешено перемещение ползунка
                  if(  e.clientX < this.offsetLeft || e.clientX > (this.offsetLeft + this.scopeWidth) )
                      return;
                  
                  var that = this,
                      value,
                      // Переменная отвечающая за возможное перемещение ползунка (доступное расстояние)
                      xPosScopeLeft = e.clientX - this.offsetLeft,     
                      
                      // Процентное значение положение ползунка относительно всего слайдера
                      leftPrecentage = xPosScopeLeft / this.scopeWidth * 100,

                      // Переменные отвечающие за предыдущий и последующий ползунки
                      prevSliceValue = this.ranges[+this.DOM.currentSlice.dataset.idx - 1],
                      nextSliceValue = this.ranges[+this.DOM.currentSlice.dataset.idx + 1];    
                  
                  // Числовое значение ползунка
                  value = this.settings.min + (this.delta/100*leftPrecentage);
                  
                  // Проверка, задан ли шаг пользователем
                  if( this.settings.step )
                  {
                      // Округляем значение, до кратного значения шага
                      value = Math.round((value) / this.settings.step ) * this.settings.step
                  }
                  
                  
                  // Проверка, чтобы ползунок не выходил за пределы другого ползунка
                  if( value < prevSliceValue + this.settings.minRange )             
                       value = prevSliceValue;
                  if( value > nextSliceValue - this.settings.minRange )             
                       value = nextSliceValue;
                  
                  // Проверка, чтобы ползунок не выходил за пределы слайдера
                  if( value < (this.settings.min + this.settings.minRange) )             
                       value = this.settings.min;
                  if( value > (this.settings.max - this.settings.minRange) )             
                       value = this.settings.max;

                       
                  
                  // Переменная отвечающая за процентное значение нового положения
                  leftPrecentage = (value - this.settings.min) / this.delta * 100;
  
                  // Обновляем пользовательский интерфейс
                  window.requestAnimationFrame(function()
                  {  
                      if( that.DOM.currentSlice )
                      {
                          that.DOM.currentSlice.style.left = leftPrecentage + '%';
                          that.DOM.currentSliceValue.innerHTML = value.toFixed(1).replace('.0', '');
                      }
                  })
                  // Обновляем список значений ползунков
                  this.ranges[this.DOM.currentSlice.dataset.idx] = +value.toFixed(1);  
                  
                  // Вызываем событие change
                  this.trigger('change', {idx:+this.DOM.currentSlice.dataset.idx, value:value, ranges:this.ranges})
              }
          }
      }
  }
  })(this);
  

  // Настройки слайдера // 

  var multiRange1 = new MultiRange(document.querySelector('.multiRange'), 
  {
      min    : 2000,
      max    : 2024,
      ticks   : 24,
      step   : 1
  });
  

  
  var multiRange2 = new MultiRange(document.querySelector('.multiRange.type1'), 
      {
          min      : 2000,
          max      : 2024,
          ticks    : 24,
          step     : 1,
      });
  
  multiRange1.on('changed', onrangeChanged);
  multiRange2.on('changed', onrangeChanged);
                 
  function onrangeChanged(e)
  {
      console.log( e, e.detail )
  }

      // Находим кнопки по их id
      var seasonButton = document.getElementById('seasonButton');
      var monthButton = document.getElementById('monthButton');
  
      // Находим элементы с классами multiRange и type1
      var multiRange1 = document.querySelector('.multiRange');
      var multiRange2 = document.querySelector('.multiRange.type1');
  
      // Находим инпуты min и max и период
      var minInput = document.getElementById('minInput');
      var maxInput = document.getElementById('maxInput');
      var rangeInput1 = document.getElementById('rangeInput1');
      var rangeInput2 = document.getElementById('rangeInput2');
  
      // Добавляем обработчики событий для кнопок
      seasonButton.addEventListener('click', function() 
      {

        // Показываем режим "Время года"
        multiRange1.classList.remove('hidden');
        multiRange2.classList.add('hidden');
      });
  
      monthButton.addEventListener('click', function() 
      {

        // Показываем режим "Месяцы"
        multiRange1.classList.add('hidden');
        multiRange2.classList.remove('hidden');
    });



      document.addEventListener('DOMContentLoaded', function() 
      {
        // Находим кнопку "Обновить границы слайдера"
        var updateButton = document.getElementById('updateButton');
        
    
        // Добавляем обработчик события для кнопки "Обновить границы слайдера"
        updateButton.addEventListener('click', function() 
        {
            document.querySelector('.multiRange').classList.remove('hidden');

            // Получаем новые значения минимального и максимального года из полей ввода
            var newMinYear = parseInt(minInput.value);
            var newMaxYear = parseInt(maxInput.value);
            var newRange1 = parseInt(rangeInput1.value);
            var newRange2 = parseInt(rangeInput2.value);


            // Проверяем, чтобы newRange1 не было меньше newMinYear
            if (newRange1 < newMinYear) 
            {
                // Если newRange1 меньше newMinYear, устанавливаем значение newRange1 равным newMinYear
                newRange1 = newMinYear;
            }

            // Проверяем, чтобы newRange2 не было больше newMaxYear
            if (newRange2 > newMaxYear) 
            {
                // Если newRange2 больше newMaxYear, устанавливаем значение newRange2 равным newMaxYear
                newRange2 = newMaxYear - 1;
            }

            if (newRange2 == newMaxYear) 
            {
                newRange2 = newMaxYear - 1;
            }
            
            // Очищаем существующие слайдеры
            var existingSliders = document.querySelectorAll('.multiRange');
            existingSliders.forEach(function(slider) 
            {
                slider.innerHTML = ''; 
            }); 

            // Создаем новые слайдеры с обновленными значениями
            var multiRange1 = new MultiRange(document.querySelector('.multiRange'), 
            {
                min: newMinYear,
                max: newMaxYear,
                ticks: newMaxYear - newMinYear,
                step: 1,
                ranges : [newRange1, newRange2],
            });
    
            var multiRange2 = new MultiRange(document.querySelector('.multiRange.type1'), 
            {
                min: newRange1,
                max: newRange2,
                ticks: newRange2 - newRange1,
                step: 1
            });
    
            // Добавляем обработчики событий для новых слайдеров
            multiRange1.on('changed', onrangeChanged);
            multiRange2.on('changed', onrangeChanged);
    
            // Обновляем обработчики событий для кнопок переключения между слайдерами
            seasonButton.addEventListener('click', function() 
            {
                // Показываем режим "Время года"
                multiRange1.DOM.scope.classList.remove('hidden');
                multiRange2.DOM.scope.classList.add('hidden');
            });
    
            monthButton.addEventListener('click', function() 
            {
                // Показываем режим "Месяцы"
                multiRange1.DOM.scope.classList.add('hidden');
                multiRange2.DOM.scope.classList.remove('hidden');
                var values1 = multiRange1.ranges;
                var value1_1 = values1[1];
                var value1_2 = values1[2]; 

                // Создаем новый экземпляр MultiRange для второго слайдера с границами value1_1 и value1_2
                var newRangeMin = value1_1;
                var newRangeMax = value1_2;
                
                // Проверяем, чтобы минимальное значение нового диапазона было меньше максимального
                if (newRangeMin < newRangeMax) 
                {
                    // Создаем новый экземпляр MultiRange
                    multiRange2 = new MultiRange(document.querySelector('.multiRange.type1'), {
                        min: newRangeMin,
                        max: newRangeMax,
                        ticks: (newRangeMax - newRangeMin) * 12,
                        step: 1/12
                    });

                    // Добавляем обработчик событий для нового слайдера
                    multiRange2.on('changed', onrangeChanged);
                } 
            });
        });
    });


