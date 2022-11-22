# Input

50x50 table

Each cell would contain (tensor of 385003 inputs):

- One-hot-encoded terrain (3)

  - Plain
  - Swamp
  - Wall

- Creep (154 inputs per cell) <------------- need to compress

  - Is creep controlled? (boolean 1 or 0)
  - Is creep mine? (boolean 1 or 0)
  - Array of 50 body parts (150 inputs)
    - One-hot-encoded body part type
      - MOVE
      - ATTACK
    - Hits - scaled between 0 and 1
  - Fatigue - scaled between 0 and 1
  - TTL - scaled between 0 and 1

  What is actually needed for each cell (6 channels):

  - do I control it?
  - is it enemy?
  - is it plain?
  - is it swamp?
  - is it wall?
  - approximation of remaining attack capability and how it decreases over time = attack score
  - approximation of remaining move capability and how it decreases over time - move score
  - fatigue
  - TTL

BODY_PART_SCORE = SUM{ position \* x + b }

DOES NOT HAVE TO BE PRECISE

We end up with convolution layer:

- 50 x 50 x 6

Let's look for patterns in 5x5 kernels first (creep + 2 cells to each side). Stride is 1 - verify all possible positions.

Output = 16 probabilities:

- GO x8 (to each side)
- ATTACK x8 (to each side)

Score calculation:

- sum { (own*hits - enemy_hits) * -(k \_ time_step) }

The further into the future, the smaller the score.

Network idea:

- Normalization
- Convolution 50x50x6 5x5 filters=4
- Polling 2x2
- Convolution 25x25x6 5x5 filters=16
- Polling 5x5
- Flatten
- Dense 16
