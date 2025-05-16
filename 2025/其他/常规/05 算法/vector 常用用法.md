```cpp
#include <iostream>
#include <vector>

using namespace std;

int main() {
	// 1.构造示例
	vector<int> vec1;
	vector<int> vec2(5); // 指定大小，元素默认初始化为 0
	vector<int> vec3(5, 10); // 指定大小和初始值
	vector<int> vec4 = {1, 2, 3, 4, 5};

	// 2. 容量操作
	cout << "vec4 size:" << vec4.size() << endl; // 输出大小
	cout << "vec4 capacity:" << vec4.capacity() << endl; // 输出容量
	vec4.reserve(10); // 预留空间
	cout << "After reserve, vec4 capacity:" << vec4.capacity() << endl;

	// 3. 元素访问
	cout << "First element of vec4:" << vec4.front() << endl; // 访问第一个元素
	cout << "Last element of vec4:" << vec4.back() << endl; // 访问最后一个元素
	cout << "Element at index 2 of vec4:" << vec4[2] << endl; // 通过索引访问
	cout << "Element at index 2 of vec4 (safe):" << vec4.at(2) << endl; // 安全访问

	// 4. 修改器
	vec.push_back(6); // 添加元素到末尾
	cout << "After push_back, vec4:";

	for(int val : vec4) {
		cout << val << " ";
	}

	cout << endl;

	vec4.pop_back(); // 移除最后一个元素
    std::cout << "After pop_back, vec4: ";
    for (int val : vec4) {
        std::cout << val << " ";
    }
    std::cout << std::endl;

    vec4.insert(vec4.begin() + 2, 99); // 在索引2的位置插入99
    std::cout << "After insert, vec4: ";
    for (int val : vec4) {
        std::cout << val << " ";
    }
    std::cout << std::endl;

    vec4.erase(vec4.begin() + 2); // 删除索引为2的元素
    std::cout << "After erase, vec4: ";
    for (int val : vec4) {
        std::cout << val << " ";
    }
    std::cout << std::endl;

    vec4.resize(10); // 调整大小
    std::cout << "After resize, vec4: ";
    for (int val : vec4) {
        std::cout << val << " ";
    }
    std::cout << std::endl;

    vec4.clear(); // 清空vector
    std::cout << "After clear, vec4 size: " << vec4.size() << std::endl;

    // 5. 迭代器
    std::vector<int> vec5 = {10, 20, 30, 40, 50};
    std::cout << "vec5 elements (using iterators): ";
    for (auto it = vec5.begin(); it != vec5.end(); ++it) {
        std::cout << *it << " ";
    }
    std::cout << std::endl;

    std::cout << "vec5 elements (reverse iterators): ";
    for (auto it = vec5.rbegin(); it != vec5.rend(); ++it) {
        std::cout << *it << " ";
    }
    std::cout << std::endl;

    // 6. 其他操作
    std::vector<int> vec6 = {1, 2, 3};
    std::vector<int> vec7 = {4, 5, 6};
    vec6.swap(vec7); // 交换两个vector的内容
    std::cout << "After swap, vec6: ";
    for (int val : vec6) {
        std::cout << val << " ";
    }
    std::cout << ", vec7: ";
    for (int val : vec7) {
        std::cout << val << " ";
    }
    std::cout << std::endl;

    return 0;

}
```

