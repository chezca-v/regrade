# Circuit design workspace

Store reviewed schematics, wiring diagrams, and bill-of-materials notes here.

Before connecting a device under test, document and verify the isolated 5 V
test fixture, current limiting, fuse/PTC selection, MOSFET/load thermal limits,
grounding, ESP32 logic-level compatibility, and independent power supply for
the MG996R servo. The ESP32 GPIO must not power the servo directly. The firmware
does not enable the electronic load in this scaffold.
