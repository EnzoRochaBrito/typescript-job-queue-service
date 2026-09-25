export class HeapBuilder<T> {

    private arr: Array<T>
    
    constructor(
        private readonly logic: {
            comparison: (left: T, target: T) => boolean,
            isEqual: (left: T, right: T) => boolean
        }
    ) {
        this.arr = []
    }

    insert(value: T) {
        this.arr.push(value)
        let index = this.arr.length-1

        while (index > 0 && this.logic.comparison(this.arr[Math.floor((index - 1) / 2)]!, this.arr[index]!)) {

            const temp = this.arr[index]!;
            this.arr[index] = this.arr[Math.floor((index - 1) / 2)]!;
            this.arr[Math.floor((index - 1) / 2)] = temp;
            
            index = Math.floor((index - 1) / 2);
        }
    }

    remove(value: T) {
        let index = -1;
        for (let i = 0; i < this.arr.length; i++) {
            if (this.logic.isEqual(this.arr[i]!, value)) {
                index = i;
                break;
            }
        }
        
        if (index === -1) return;

        this.arr[index] = this.arr[this.arr.length - 1]!;

        this.arr.pop();

        while (true) {
            let left_child = 2 * index + 1;
            let right_child = 2 * index + 2;

            let priorityChild = index;

            if (left_child < this.arr.length && this.logic.comparison(this.arr[priorityChild]!, this.arr[left_child]!)) {
                priorityChild = left_child;
            }

            if (right_child < this.arr.length && this.logic.comparison(this.arr[priorityChild]!, this.arr[right_child]!)) {
                priorityChild = right_child;
            }

            if (priorityChild !== index) {
                let temp = this.arr[index]!;
                this.arr[index] = this.arr[priorityChild]!;
                this.arr[priorityChild] = temp;
                index = priorityChild;
            } else {
                break;
            }
        }
    }

    top() {
        return this.arr[0]
    }

    pop() {
        const topValue = this.top()
        if (topValue === undefined)
            return
        this.remove(topValue)
        return topValue
    }
}
