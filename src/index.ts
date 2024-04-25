import { data } from "./data.js";
import { IData, IBar } from "./type";

interface IChartData {
    canvas: HTMLCanvasElement;
    bars: IBar[];
}

class Chart {
    private ctx: CanvasRenderingContext2D;
    private scale: number = 1;
    private offsetX: number = 0;
    private offsetY: number = 0;
    private isDragging: boolean = false;
    private dragStartX: number = 0;
    private dragStartY: number = 0;
    private minPrice: number = 0;
    private maxPrice: number = 0;

    constructor(private data: IBar[], private canvas: HTMLCanvasElement) {
        this.ctx = this.canvas.getContext('2d')!;
        this.calculatePriceRange();
        this.setupEvents();
    }

    private calculatePriceRange() {
        this.minPrice = Math.min(...this.data.map(bar => bar.Low));
        this.maxPrice = Math.max(...this.data.map(bar => bar.High));
    }

    private setupEvents() {
        this.canvas.addEventListener('wheel', this.handleMouseWheel.bind(this));
        this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
        this.canvas.addEventListener('mouseleave', this.handleMouseLeave.bind(this));
    }

    drawChart() {
        const { width, height } = this.canvas;
        this.ctx.clearRect(0, 0, width, height);
        this.ctx.strokeStyle = '#000';
        this.ctx.strokeRect(0, 0, width, height);
        this.drawBars();
    }

    drawBars() {
        const { width, height } = this.canvas;
        const barWidth = width / this.data.length;
        const scaledWidth = width * this.scale;
        const scaledHeight = height * this.scale;
        const offsetX = this.offsetX - (scaledWidth - width) / 2;
        const offsetY = this.offsetY - (scaledHeight - height) / 2;

        let previousDate: string | null = null;

        this.data.forEach((bar, index) => {
            const x = (index * width) / this.data.length * this.scale - offsetX;
            const y = scaledHeight - ((bar.Close - this.minPrice) / (this.maxPrice - this.minPrice) * scaledHeight) - offsetY;
            const barHeight = (bar.High - bar.Low) / (this.maxPrice - this.minPrice) * scaledHeight;

            this.ctx.fillStyle = bar.Close > bar.Open ? 'green' : 'red';
            this.ctx.fillRect(x, y, barWidth * this.scale, barHeight);

            const currentDate = this.getDateFromBar(bar.Time);
            if (currentDate !== previousDate) {
                previousDate = currentDate;
                const labelX = (index * width) / this.data.length * this.scale - offsetX + barWidth / 2;
                this.drawDateLabel(currentDate, labelX, height - 5);
            }
        });
    }

    getDateFromBar(time: number): string {
        const date = new Date(time * 1000);
        return `${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()}`;
    }

    drawDateLabel(date: string, x: number, y: number) {
        this.ctx.fillStyle = 'black';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(date, x, y);
    }

    handleMouseWheel(event: WheelEvent) {
        const delta = Math.sign(event.deltaY);
        const zoomFactor = delta > 0 ? 1.1 : 0.9;

        const rect = this.canvas.getBoundingClientRect();
        const offsetX = event.clientX - rect.left;
        const offsetY = event.clientY - rect.top;

        const previousScale = this.scale;

        this.scale *= zoomFactor;

        const minScale = 1;
        this.scale = Math.max(minScale, this.scale);

        if (this.scale > minScale) {
            this.ctx.scale(zoomFactor, zoomFactor);
        }

        this.offsetX = offsetX - (offsetX - this.offsetX) * (this.scale / previousScale);
        this.offsetY = offsetY - (offsetY - this.offsetY) * (this.scale / previousScale);

        this.drawChart();
    }

    handleMouseDown(event: MouseEvent) {
        this.isDragging = true;
        this.dragStartX = event.clientX;
        this.dragStartY = event.clientY;
    }

    handleMouseMove(event: MouseEvent) {
        if (this.isDragging) {
            const deltaX = event.clientX - this.dragStartX;
            const deltaY = event.clientY - this.dragStartY;
            this.offsetX += deltaX;
            this.offsetY += deltaY;
            this.dragStartX = event.clientX;
            this.dragStartY = event.clientY;
            this.drawChart();
        }
    }

    handleMouseUp() {
        this.isDragging = false;
    }

    handleMouseLeave() {
        this.isDragging = false;
    }
}

class DataHandler {
    constructor(private chartData: IChartData[]) {
        this.initCharts();
    }

    private initCharts() {
        const chartsContainer = document.getElementById('chartsContainer');
        if (chartsContainer) {
            this.chartData.forEach((data, index) => {
                const { canvas, bars } = data;
                canvas.id = `chartCanvas${index + 1}`;
                canvas.width = 800;
                canvas.height = 400;
                chartsContainer.appendChild(canvas);

                const chart = new Chart(bars, canvas);
                chart.drawChart();
            });
        } else {
            console.error("Element '#chartsContainer' not found on the page.");
        }
    }
}

const chartData: IChartData[] = data.map((chartData: IData) => ({
    canvas: document.createElement('canvas'),
    bars: chartData.Bars
}));

new DataHandler(chartData);
