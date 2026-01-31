/***
 *
 * simple but not the best way
 *
 * 1. from client side sent information
 * 2. genarate token jwt.sign()
 * 3. on the client side set token to the localstorage.
 */
/***
 * 2..
 * using cookies
 *  1.set cors middleware to allow cookies for our client side
 *
 * 3..
 *
 * using http only cookies
 * 1. from client side send the information(email, better : fairbase aer auth token) to genarate token.
 * 2. on the server side, accepet user information and if needed validate it
 * 3. genarate token in the server side using secret and expirsIn
 *
 * 4...
 * set the token to the cookies
 * 4. while calling the api tell to use withCredentials
 *   axios
          .post("http://localhost:3000/jwt", userData, {
            withCredentials: true,
          })
     or for fetch add oftion credentials:"include"

 * 5. in the cors setting set credentials and origin
           // middleware
       app.use(
          cors({
            origin: ["http://localhost:5173"],
            Credential: true,
              }),
             );
 *
 * 6. after the genarating the token set it to the cookies with some oftions
 *  // set token in the cookies
           res.cookie("token", token, {
             httpOnly: true,
             secure: false,
             sameSite: "lax",
           });
 *
 * 7. one time :use cookieParser as middleware
 * 8. for every api you want to verify token :in the client site : if using axios 
 *    withCredentials:true for fetch:credentials include
 * 
 *   verify token
 *  8. Check token exists. if not , return 401 --> unauthorized
 *  9. jwt.verify function. if error return 401 --> unauthorized
 *  10. if token is valid set the decoded value to the req object
 *  11. if data asking for doesn't match with the owner or bearer of the token
 *      --> 403 --> forbidden access
 * 
 * 
 * // approach to jwt
 * 
 *    ok type approach :
 *  1. genarate jwt > send to the client > store it in the local storage > send the token to the server using
 *     header > on the server verify token
 * 
 * // best approach in genaral :
 *  2.genarate token > set token to the cookies > ensure client and server exchange cookies > on the server 
 *    verify token
 * 
 *  // firebase authentication approach :
 *  1. alredy have the token in firebase (client side) > we will send the token to the server using auth header >
 *     verify the token
 * 
 * 
 * 
 * 
 */
