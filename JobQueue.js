
class JobQueue {
    constructor() {
        // 함수들을 담는 Queue 멤버 변수
        this.queue = [];
        
        // 락 선언 및 초기화
        this.lock = new Int32Array(new SharedArrayBuffer(4));
        Atomics.store(this.lock, 0, 0);
    }

    // enqueue와 dequeue는 데이터 동기화를 위해 lock을 걸고 실행해야함.
    enqueue(item) {
        // Queue에 삽입을 위해 lock을 얻어야함
        while (Atomics.compareExchange(this.lock, 0, 0, 1) !== 0) {} // CAS 패턴을 이용한 일종의 Spin lock
        this.queue.push(item);
        Atomics.store(this.lock, 0, 0); // lock 해제
    }

    dequeue() {  
        // Queue에서 삭제하기 위해 lock을 얻어야함
        while (Atomics.compareExchange(this.lock, 0, 0, 1) !== 0) {} // CAS 패턴을 이용한 일종의 Spin lock
        const item = this.queue.shift();
        Atomics.store(this.lock, 0, 0); // lock 해제
        return item;
    }

    peek() {  // front 반환
        return this.queue[0];
    }

    isEmpty() {
        return this.queue.length === 0;
    }

    size() {
        return this.queue.length;
    }


}



// 사용 예시
// const queue = new Queue();
// queue.enqueue(1);
// queue.enqueue(2);
// queue.enqueue(3);
// console.log(queue.dequeue()); // 1
// console.log(queue.peek()); // 2
// console.log(queue.size()); // 2

module.exports = {JobQueue};
