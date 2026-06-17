import React, { useState, useEffect, useRef } from 'react';
import Icon from '../ui/Icon';

/**
 * GATE Official Pattern Virtual Calculator
 * Optimized for high visibility, robust state management, and draggability
 */
export default function VirtualCalculator({ isOpen, onClose }) {
  const [expression, setExpression] = useState('');
  const [display, setDisplay] = useState('0');
  const [memory, setMemory] = useState(0);
  const [isDeg, setIsDeg] = useState(true);
  const [waitingForOperand, setWaitingForOperand] = useState(true);
  const [pendingOperator, setPendingOperator] = useState(null);
  const [firstOperand, setFirstOperand] = useState(null);

  // Draggability state
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const calculatorRef = useRef(null);

  // Close on Escape key
  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  // Dragging logic
  const handleMouseDown = (e) => {
    if (e.target.closest('.drag-handle')) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
    }
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDragging) {
        setPosition({
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStart]);

  if (!isOpen) return null;

  const handleNumber = (num) => {
    if (waitingForOperand || display === '0' || display === 'Error') {
      setDisplay(String(num));
      setWaitingForOperand(false);
    } else {
      setDisplay(display + String(num));
    }
  };

  const handleDecimal = () => {
    if (waitingForOperand) {
      setDisplay('0.');
      setWaitingForOperand(false);
    } else if (!display.includes('.')) {
      setDisplay(display + '.');
    }
  };

  const performCalculation = (a, b, op) => {
    const n1 = parseFloat(a);
    const n2 = parseFloat(b);
    if (isNaN(n1) || isNaN(n2)) return n2;

    switch (op) {
      case '+': return n1 + n2;
      case '-': return n1 - n2;
      case '*': return n1 * n2;
      case '/': return n2 !== 0 ? n1 / n2 : 'Error';
      case 'mod': return n1 % n2;
      case 'pow': return Math.pow(n1, n2);
      case 'yroot': return Math.pow(n1, 1 / n2);
      case 'log_y': return n1 > 0 && n2 > 0 && n2 !== 1 ? Math.log(n1) / Math.log(n2) : 'Error';
      case 'Exp': return n1 * Math.pow(10, n2);
      default: return n2;
    }
  };

  const handleOperator = (nextOp) => {
    const inputValue = display;

    if (firstOperand === null) {
      setFirstOperand(inputValue);
      setExpression(`${inputValue} ${nextOp} `);
    } else if (pendingOperator) {
      const result = performCalculation(firstOperand, inputValue, pendingOperator);
      if (result === 'Error') {
        handleClear();
        setDisplay('Error');
        return;
      }
      setFirstOperand(String(result));
      setDisplay(String(result));
      setExpression(`${result} ${nextOp} `);
    }

    setWaitingForOperand(true);
    setPendingOperator(nextOp);
  };

  const handleEqual = () => {
    if (firstOperand === null || !pendingOperator) return;

    const result = performCalculation(firstOperand, display, pendingOperator);
    if (result === 'Error') {
      handleClear();
      setDisplay('Error');
    } else {
      const formatted = Number(result).toFixed(10).replace(/\.?0+$/, '');
      setDisplay(String(formatted));
      setExpression('');
      setFirstOperand(null);
      setPendingOperator(null);
      setWaitingForOperand(true);
    }
  };

  const handleClear = () => {
    setDisplay('0');
    setExpression('');
    setFirstOperand(null);
    setPendingOperator(null);
    setWaitingForOperand(true);
  };

  const handleBackspace = () => {
    if (waitingForOperand || display === 'Error') return;
    if (display.length > 1) {
      setDisplay(display.slice(0, -1));
    } else {
      setDisplay('0');
      setWaitingForOperand(true);
    }
  };

  const handleScientific = (func) => {
    if (display === 'Error') return;
    const val = parseFloat(display);
    if (isNaN(val)) return;

    let res;
    const rad = isDeg ? (val * Math.PI) / 180 : val;

    try {
      switch (func) {
        case 'sin': res = Math.sin(rad); break;
        case 'cos': res = Math.cos(rad); break;
        case 'tan': res = Math.tan(rad); break;
        case 'asin': res = isDeg ? (Math.asin(val) * 180) / Math.PI : Math.asin(val); break;
        case 'acos': res = isDeg ? (Math.acos(val) * 180) / Math.PI : Math.acos(val); break;
        case 'atan': res = isDeg ? (Math.atan(val) * 180) / Math.PI : Math.atan(val); break;
        case 'sinh': res = Math.sinh(val); break;
        case 'cosh': res = Math.cosh(val); break;
        case 'tanh': res = Math.tanh(val); break;
        case 'asinh': res = Math.asinh(val); break;
        case 'acosh': res = Math.acosh(val); break;
        case 'atanh': res = Math.atanh(val); break;
        case 'log': res = Math.log10(val); break;
        case 'ln': res = Math.log(val); break;
        case 'log2': res = Math.log2(val); break;
        case 'exp': res = Math.exp(val); break;
        case 'pow10': res = Math.pow(10, val); break;
        case 'sqrt': res = val >= 0 ? Math.sqrt(val) : 'Error'; break;
        case 'cbrt': res = Math.cbrt(val); break;
        case 'sq': res = Math.pow(val, 2); break;
        case 'cu': res = Math.pow(val, 3); break;
        case 'recip': res = val !== 0 ? 1 / val : 'Error'; break;
        case 'abs': res = Math.abs(val); break;
        case 'fact':
          if (val < 0 || val > 170) res = 'Error';
          else {
            res = 1;
            for (let i = 2; i <= Math.floor(val); i++) res *= i;
          }
          break;
        case 'pi': res = Math.PI; break;
        case 'e': res = Math.E; break;
        case 'sign': res = val * -1; break;
        default: return;
      }

      if (res === 'Error') {
        setDisplay('Error');
      } else {
        const formatted = Number(res).toFixed(10).replace(/\.?0+$/, '');
        setDisplay(String(formatted));
      }
      setWaitingForOperand(true);
    } catch {
      setDisplay('Error');
    }
  };

  const handleMemory = (action) => {
    if (display === 'Error') return;
    const val = parseFloat(display);
    switch (action) {
      case 'MC': setMemory(0); break;
      case 'MR': setDisplay(String(memory)); setWaitingForOperand(true); break;
      case 'MS': setMemory(val); setWaitingForOperand(true); break;
      case 'M+': setMemory(memory + val); setWaitingForOperand(true); break;
      case 'M-': setMemory(memory - val); setWaitingForOperand(true); break;
      default: break;
    }
  };

  // Explicit inline styles to override any conflicting CSS
  const btnBaseStyle = {
    height: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '11px',
    fontWeight: '700',
    borderRadius: '4px',
    border: '1px solid #999999',
    boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
    cursor: 'pointer',
    transition: 'all 0.1s',
    userSelect: 'none',
  };

  const standardBtnStyle = { ...btnBaseStyle, backgroundColor: '#eeeeee', color: '#333333' };
  const numberBtnStyle = { ...btnBaseStyle, backgroundColor: '#ffffff', color: '#000000', fontSize: '14px', fontWeight: '900' };
  const redBtnStyle = { ...btnBaseStyle, backgroundColor: '#d9534f', color: '#ffffff', borderColor: '#ac2925' };
  const greenBtnStyle = { 
    ...btnBaseStyle, 
    backgroundColor: '#5cb85c', 
    color: '#ffffff', 
    borderColor: '#4cae4c', 
    height: '100%', 
    fontSize: '24px', // Increased size for better visibility
    fontWeight: '900',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  };

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ pointerEvents: 'none' }}
    >
      {/* Overlay doesn't close on click now to allow dragging without accidental closure if clicking slightly outside */}
      <div 
        className="absolute inset-0 bg-black/30" 
        style={{ pointerEvents: 'auto' }} 
        onClick={onClose} 
      />
      
      <div 
        ref={calculatorRef}
        className="w-full max-w-[520px] sm:w-[520px] bg-[#cccccc] border-2 border-[#666666] shadow-2xl rounded-sm flex flex-col overflow-hidden"
        style={{ 
          pointerEvents: 'auto', 
          position: 'relative',
          transform: `translate(${position.x}px, ${position.y}px)`,
          transition: isDragging ? 'none' : 'transform 0.1s ease-out'
        }}
      >
        {/* Title Bar - Drag Handle */}
        <div 
          className="bg-[#4a90e2] px-3 py-2 flex items-center justify-between text-white border-b border-[#357abd] drag-handle cursor-move"
          onMouseDown={handleMouseDown}
        >
          <span className="text-sm font-bold tracking-wide pointer-events-none">Scientific Calculator</span>
          <div className="flex items-center gap-3">
            <button className="px-2 py-0.5 bg-[#5da5f5] hover:bg-[#7db9f7] text-[10px] rounded-sm font-bold">HELP</button>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }} 
              className="hover:bg-red-500 p-1 rounded-sm transition-colors"
            >
              <Icon name="close" className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Display Screen */}
        <div className="p-4 bg-[#f4f4f4] border-b border-[#aaaaaa] space-y-2">
          <div className="h-8 bg-white border border-[#999999] rounded-sm px-3 flex items-center justify-end text-xs font-mono text-gray-500 overflow-hidden">
            {expression}
          </div>
          <div className="h-12 bg-white border border-[#999999] rounded-sm px-3 flex items-center justify-end text-2xl font-black font-mono text-black overflow-hidden">
            {display}
          </div>
        </div>

        {/* Keypad */}
        <div className="p-4 grid grid-cols-11 gap-2">
          {/* Row 1 */}
          <button style={standardBtnStyle} onClick={() => handleOperator('mod')}>mod</button>
          <div className="col-span-2 flex items-center justify-around bg-[#bbbbbb] rounded border border-[#999999] px-1">
            <label className="flex items-center gap-1 text-[10px] font-black text-black cursor-pointer">
              <input type="radio" checked={isDeg} onChange={() => setIsDeg(true)} /> DEG
            </label>
            <label className="flex items-center gap-1 text-[10px] font-black text-black cursor-pointer">
              <input type="radio" checked={!isDeg} onChange={() => setIsDeg(false)} /> RAD
            </label>
          </div>
          <div className="col-span-3" />
          <button style={standardBtnStyle} onClick={() => handleMemory('MC')}>MC</button>
          <button style={standardBtnStyle} onClick={() => handleMemory('MR')}>MR</button>
          <button style={standardBtnStyle} onClick={() => handleMemory('MS')}>MS</button>
          <button style={standardBtnStyle} onClick={() => handleMemory('M+')}>M+</button>
          <button style={standardBtnStyle} onClick={() => handleMemory('M-')}>M-</button>

          {/* Row 2 */}
          <button style={standardBtnStyle} onClick={() => handleScientific('sinh')}>sinh</button>
          <button style={standardBtnStyle} onClick={() => handleScientific('cosh')}>cosh</button>
          <button style={standardBtnStyle} onClick={() => handleScientific('tanh')}>tanh</button>
          <button style={standardBtnStyle} onClick={() => handleOperator('Exp')}>Exp</button>
          <button style={standardBtnStyle} onClick={() => handleNumber('(')}>(</button>
          <button style={standardBtnStyle} onClick={() => handleNumber(')')}>)</button>
          <button style={{ ...redBtnStyle, gridColumn: 'span 2' }} onClick={handleBackspace}>←</button>
          <button style={redBtnStyle} onClick={handleClear}>C</button>
          <button style={redBtnStyle} onClick={() => handleScientific('sign')}>+/-</button>
          <button style={standardBtnStyle} onClick={() => handleScientific('sqrt')}>√</button>

          {/* Row 3 */}
          <button style={standardBtnStyle} onClick={() => handleScientific('asinh')}>sinh⁻¹</button>
          <button style={standardBtnStyle} onClick={() => handleScientific('acosh')}>cosh⁻¹</button>
          <button style={standardBtnStyle} onClick={() => handleScientific('atanh')}>tanh⁻¹</button>
          <button style={standardBtnStyle} onClick={() => handleScientific('log2')}>log₂x</button>
          <button style={standardBtnStyle} onClick={() => handleScientific('ln')}>ln</button>
          <button style={standardBtnStyle} onClick={() => handleScientific('log')}>log</button>
          <button style={numberBtnStyle} onClick={() => handleNumber('7')}>7</button>
          <button style={numberBtnStyle} onClick={() => handleNumber('8')}>8</button>
          <button style={numberBtnStyle} onClick={() => handleNumber('9')}>9</button>
          <button style={standardBtnStyle} onClick={() => handleOperator('/')}>/</button>
          <button style={standardBtnStyle} onClick={() => handleOperator('mod')}>%</button>

          {/* Row 4 */}
          <button style={standardBtnStyle} onClick={() => handleScientific('pi')}>π</button>
          <button style={standardBtnStyle} onClick={() => handleScientific('e')}>e</button>
          <button style={standardBtnStyle} onClick={() => handleScientific('fact')}>n!</button>
          <button style={standardBtnStyle} onClick={() => handleOperator('log_y')}>log<sub>y</sub>x</button>
          <button style={standardBtnStyle} onClick={() => handleScientific('exp')}>eˣ</button>
          <button style={standardBtnStyle} onClick={() => handleScientific('pow10')}>10ˣ</button>
          <button style={numberBtnStyle} onClick={() => handleNumber('4')}>4</button>
          <button style={numberBtnStyle} onClick={() => handleNumber('5')}>5</button>
          <button style={numberBtnStyle} onClick={() => handleNumber('6')}>6</button>
          <button style={standardBtnStyle} onClick={() => handleOperator('*')}>*</button>
          <button style={standardBtnStyle} onClick={() => handleScientific('recip')}>1/x</button>

          {/* Row 5 */}
          <button style={standardBtnStyle} onClick={() => handleScientific('sin')}>sin</button>
          <button style={standardBtnStyle} onClick={() => handleScientific('cos')}>cos</button>
          <button style={standardBtnStyle} onClick={() => handleScientific('tan')}>tan</button>
          <button style={standardBtnStyle} onClick={() => handleOperator('pow')}>x<sup>y</sup></button>
          <button style={standardBtnStyle} onClick={() => handleScientific('cu')}>x³</button>
          <button style={standardBtnStyle} onClick={() => handleScientific('sq')}>x²</button>
          <button style={numberBtnStyle} onClick={() => handleNumber('1')}>1</button>
          <button style={numberBtnStyle} onClick={() => handleNumber('2')}>2</button>
          <button style={numberBtnStyle} onClick={() => handleNumber('3')}>3</button>
          <button style={standardBtnStyle} onClick={() => handleOperator('-')}>-</button>
          <div className="row-span-2">
            <button style={greenBtnStyle} onClick={handleEqual}>
              <span style={{ transform: 'scaleX(1.5)', display: 'inline-block' }}>=</span>
            </button>
          </div>

          {/* Row 6 */}
          <button style={standardBtnStyle} onClick={() => handleScientific('asin')}>sin⁻¹</button>
          <button style={standardBtnStyle} onClick={() => handleScientific('acos')}>cos⁻¹</button>
          <button style={standardBtnStyle} onClick={() => handleScientific('atan')}>tan⁻¹</button>
          <button style={standardBtnStyle} onClick={() => handleOperator('yroot')}><sup>y</sup>√x</button>
          <button style={standardBtnStyle} onClick={() => handleScientific('cbrt')}>³√x</button>
          <button style={standardBtnStyle} onClick={() => handleScientific('abs')}>|x|</button>
          <button style={{ ...numberBtnStyle, gridColumn: 'span 2' }} onClick={() => handleNumber('0')}>0</button>
          <button style={numberBtnStyle} onClick={handleDecimal}>.</button>
          <button style={standardBtnStyle} onClick={() => handleOperator('+')}>+</button>
        </div>

        {/* Status Bar */}
        <div className="px-4 py-2 bg-[#bbbbbb] text-[10px] text-[#444444] font-black flex justify-between items-center italic border-t border-[#999999]">
          <span>GATE OFFICIAL SCIENTIFIC CALCULATOR</span>
          <span>PRECISION: 10 DECIMAL PLACES</span>
        </div>
      </div>
    </div>
  );
}
