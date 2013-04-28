all: clean
	cd firefox; zip -r ../build/facepaste.xpi *
clean:
	rm -rf build
	mkdir -p build
