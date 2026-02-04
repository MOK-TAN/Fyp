import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import {
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const { width } = Dimensions.get('window');

// Dummy data - in real app, fetch from API
const AMENITIES = [
  { id: 1, name: 'CCTV', icon: 'videocam' },
  { id: 2, name: 'Covered', icon: 'umbrella' },
  { id: 3, name: '24/7', icon: 'time' },
  { id: 4, name: 'Security', icon: 'shield-checkmark' },
  { id: 5, name: 'EV Charging', icon: 'flash' },
  { id: 6, name: 'Wheelchair', icon: 'accessibility' },
];

const REVIEWS = [
  {
    id: 1,
    userName: 'Ramesh K.',
    rating: 5,
    comment: 'Great parking space! Very secure and convenient location.',
    date: 'Jan 28, 2026',
    avatar: 'R',
  },
  {
    id: 2,
    userName: 'Sita M.',
    rating: 4,
    comment: 'Good parking but a bit expensive during peak hours.',
    date: 'Jan 25, 2026',
    avatar: 'S',
  },
  {
    id: 3,
    userName: 'Hari P.',
    rating: 5,
    comment: 'Excellent facilities and very clean. Highly recommend!',
    date: 'Jan 20, 2026',
    avatar: 'H',
  },
];

const IMAGES = [
  'https://via.placeholder.com/400x250/22C55E/FFFFFF?text=Parking+View+1',
  'https://via.placeholder.com/400x250/3B82F6/FFFFFF?text=Parking+View+2',
  'https://via.placeholder.com/400x250/F59E0B/FFFFFF?text=Parking+View+3',
];

export default function ParkingDetails() {
  const params = useLocalSearchParams();
  
  const parkingId = params.parkingId as string || '1';
  const parkingName = params.parkingName as string || 'New Road Parking';
  const parkingAddress = params.parkingAddress as string || 'New Road, Kathmandu';
  const pricePerHour = params.pricePerHour as string || '50';
  const distance = params.distance as string || '2km';

  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Calculate average rating
  const averageRating = (REVIEWS.reduce((sum, review) => sum + review.rating, 0) / REVIEWS.length).toFixed(1);

  // Render star rating
  const renderStars = (rating: number) => {
    return [...Array(5)].map((_, index) => (
      <Ionicons
        key={index}
        name={index < rating ? 'star' : 'star-outline'}
        size={16}
        color="#F59E0B"
      />
    ));
  };

  // Handle book parking
  const handleBookParking = () => {
    router.push({
      pathname: '/(user)/bookings/select-slot',
      params: {
        parkingId,
        parkingName,
        pricePerHour,
      }
    });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Parking Details</Text>
        <TouchableOpacity
          style={styles.favoriteButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="heart-outline" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Image Carousel */}
        <View style={styles.imageContainer}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={(e) => {
              const index = Math.round(e.nativeEvent.contentOffset.x / width);
              setCurrentImageIndex(index);
            }}
            scrollEventThrottle={16}
          >
            {IMAGES.map((image, index) => (
              <Image
                key={index}
                source={{ uri: image }}
                style={styles.image}
              />
            ))}
          </ScrollView>
          
          {/* Image Indicators */}
          <View style={styles.imageIndicators}>
            {IMAGES.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.indicator,
                  currentImageIndex === index && styles.indicatorActive
                ]}
              />
            ))}
          </View>
        </View>

        {/* Main Info */}
        <View style={styles.infoSection}>
          <View style={styles.titleRow}>
            <View style={styles.titleLeft}>
              <Text style={styles.parkingName}>{parkingName}</Text>
              <View style={styles.locationRow}>
                <Ionicons name="location" size={16} color="#6B7280" />
                <Text style={styles.address}>{parkingAddress}</Text>
              </View>
            </View>
            <View style={styles.distanceBadge}>
              <Ionicons name="navigate" size={16} color="#22C55E" />
              <Text style={styles.distanceText}>{distance}</Text>
            </View>
          </View>

          {/* Price and Rating */}
          <View style={styles.statsRow}>
            <View style={styles.priceContainer}>
              <Text style={styles.price}>Rs {pricePerHour}</Text>
              <Text style={styles.priceUnit}>/hour</Text>
            </View>
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={20} color="#F59E0B" />
              <Text style={styles.ratingText}>{averageRating}</Text>
              <Text style={styles.reviewCount}>({REVIEWS.length} reviews)</Text>
            </View>
          </View>

          {/* Availability */}
          <View style={styles.availabilityCard}>
            <Ionicons name="checkmark-circle" size={24} color="#22C55E" />
            <View style={styles.availabilityInfo}>
              <Text style={styles.availabilityTitle}>Available Now</Text>
              <Text style={styles.availabilityText}>12 out of 20 slots free</Text>
            </View>
          </View>
        </View>

        {/* Amenities */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Amenities</Text>
          <View style={styles.amenitiesGrid}>
            {AMENITIES.map((amenity) => (
              <View key={amenity.id} style={styles.amenityItem}>
                <View style={styles.amenityIcon}>
                  <Ionicons name={amenity.icon as any} size={20} color="#22C55E" />
                </View>
                <Text style={styles.amenityText}>{amenity.name}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* About */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.aboutText}>
            Secure and convenient parking facility located in the heart of {parkingAddress}. 
            Perfect for daily commuters and visitors. Easy access from main road with 
            24/7 security surveillance.
          </Text>
        </View>

        {/* Reviews */}
        <View style={styles.section}>
          <View style={styles.reviewsHeader}>
            <Text style={styles.sectionTitle}>Reviews ({REVIEWS.length})</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          {REVIEWS.slice(0, 2).map((review) => (
            <View key={review.id} style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <View style={styles.reviewLeft}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{review.avatar}</Text>
                  </View>
                  <View>
                    <Text style={styles.reviewName}>{review.userName}</Text>
                    <Text style={styles.reviewDate}>{review.date}</Text>
                  </View>
                </View>
                <View style={styles.reviewRating}>
                  {renderStars(review.rating)}
                </View>
              </View>
              <Text style={styles.reviewComment}>{review.comment}</Text>
            </View>
          ))}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Book Button */}
      <View style={styles.footer}>
        <View style={styles.footerInfo}>
          <Text style={styles.footerPrice}>Rs {pricePerHour}/hour</Text>
          <Text style={styles.footerSubtext}>Best price guaranteed</Text>
        </View>
        <TouchableOpacity
          style={styles.bookButton}
          onPress={handleBookParking}
          activeOpacity={0.8}
        >
          <Text style={styles.bookButtonText}>Book Parking</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  favoriteButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  imageContainer: {
    height: 250,
    position: 'relative',
  },
  image: {
    width: width,
    height: 250,
  },
  imageIndicators: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  indicatorActive: {
    backgroundColor: '#fff',
    width: 24,
  },
  infoSection: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  titleLeft: {
    flex: 1,
  },
  parkingName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  address: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 4,
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  distanceText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#22C55E',
    marginLeft: 4,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  price: {
    fontSize: 24,
    fontWeight: '700',
    color: '#22C55E',
  },
  priceUnit: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginLeft: 4,
  },
  reviewCount: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 4,
  },
  availabilityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#22C55E',
  },
  availabilityInfo: {
    marginLeft: 12,
  },
  availabilityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#22C55E',
  },
  availabilityText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  section: {
    backgroundColor: '#fff',
    padding: 20,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
  },
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  amenityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  amenityIcon: {
    marginRight: 6,
  },
  amenityText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#333',
  },
  aboutText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  reviewsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#22C55E',
  },
  reviewCard: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#22C55E',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  reviewName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  reviewDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  reviewRating: {
    flexDirection: 'row',
  },
  reviewComment: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    alignItems: 'center',
    gap: 16,
  },
  footerInfo: {
    flex: 1,
  },
  footerPrice: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  footerSubtext: {
    fontSize: 12,
    color: '#6B7280',
  },
  bookButton: {
    backgroundColor: '#22C55E',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  bookButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});

// import { Ionicons } from '@expo/vector-icons';
// import { router } from 'expo-router';
// import React, { useState } from 'react';
// import {
//     ScrollView,
//     StyleSheet,
//     Text,
//     TouchableOpacity,
//     View
// } from 'react-native';
// import BottomTabs from '../../components/BottomTabs';

// const ParkingDetails = () => {
//   const [isSaved, setIsSaved] = useState(false);

//   const handleBooking = () => {
//     // Navigate to booking screen or show booking modal
//     console.log('Book parking');
//   };

//   return (
//     <View style={styles.container}>
//       {/* Header */}
//       <View style={styles.header}>
//         <TouchableOpacity
//           style={styles.backButton}
//           onPress={() => router.back()}
//         >
//           <Ionicons name="arrow-back" size={24} color="#333" />
//         </TouchableOpacity>
//         <Text style={styles.headerTitle}>Parking Details</Text>
//         <View style={{ width: 40 }} />
//       </View>

//       <ScrollView showsVerticalScrollIndicator={false}>
//         {/* Parking Image */}
//         <View style={styles.imageContainer}>
//           <View style={styles.imagePlaceholder}>
//             <Ionicons name="car" size={48} color="#22C55E" />
//             <Text style={styles.imagePlaceholderText}>Parking Image</Text>
//           </View>
//         </View>

//         {/* Parking Info */}
//         <View style={styles.infoSection}>
//           <View style={styles.infoHeader}>
//             <View style={styles.infoLeft}>
//               <Text style={styles.parkingName}>Kathmandu Mall Parking</Text>
//               <Text style={styles.parkingAddress}>Sundhara, kathmandu</Text>
//             </View>
//             <TouchableOpacity
//               style={styles.saveButton}
//               onPress={() => setIsSaved(!isSaved)}
//             >
//               <Ionicons
//                 name={isSaved ? 'bookmark' : 'bookmark-outline'}
//                 size={24}
//                 color={isSaved ? '#22C55E' : '#333'}
//               />
//             </TouchableOpacity>
//           </View>

//           {/* Distance and Time */}
//           <View style={styles.badgesContainer}>
//             <View style={styles.distanceBadge}>
//               <Text style={styles.distanceBadgeText}>250 m</Text>
//             </View>
//             <View style={styles.timeBadge}>
//               <Text style={styles.timeBadgeText}>8 AM - 9 PM</Text>
//             </View>
//           </View>
//         </View>

//         {/* Rules Section */}
//         <View style={styles.rulesSection}>
//           <Text style={styles.sectionTitle}>Rules</Text>
//           <Text style={styles.rulesText}>
//             These rules and regulations for the use of Kathmandu mall. In these
//             Rules, unless the context otherwise requires effort{' '}
//             <Text style={styles.moreLink}>more...</Text>
//           </Text>
//         </View>

//         {/* Availability and Price */}
//         <View style={styles.statsContainer}>
//           <View style={styles.statBox}>
//             <Text style={styles.statValue}>29 slots available</Text>
//           </View>
//           <View style={styles.statBox}>
//             <Text style={styles.statValue}>Rs 20 per hour</Text>
//           </View>
//         </View>

//         {/* Book Button */}
//         <View style={styles.bookButtonContainer}>
//           <TouchableOpacity
//             style={styles.bookButton}
//             onPress={handleBooking}
//             activeOpacity={0.8}
//           >
//             <Text style={styles.bookButtonText}>Book Parking</Text>
//           </TouchableOpacity>
//         </View>
//       </ScrollView>

//       {/* Bottom Tabs */}
//       <BottomTabs />
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#fff',
//   },
//   header: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     paddingHorizontal: 20,
//     paddingTop: 50,
//     paddingBottom: 15,
//     backgroundColor: '#fff',
//     borderBottomWidth: 1,
//     borderBottomColor: '#F3F4F6',
//   },
//   backButton: {
//     width: 40,
//     height: 40,
//     justifyContent: 'center',
//   },
//   headerTitle: {
//     fontSize: 18,
//     fontWeight: '600',
//     color: '#333',
//   },
//   imageContainer: {
//     width: '100%',
//     height: 220,
//     backgroundColor: '#F3F4F6',
//   },
//   imagePlaceholder: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: '#F0FDF4',
//   },
//   imagePlaceholderText: {
//     marginTop: 8,
//     fontSize: 14,
//     color: '#22C55E',
//     fontWeight: '500',
//   },
//   infoSection: {
//     padding: 20,
//   },
//   infoHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'flex-start',
//     marginBottom: 16,
//   },
//   infoLeft: {
//     flex: 1,
//   },
//   parkingName: {
//     fontSize: 20,
//     fontWeight: '700',
//     color: '#333',
//     marginBottom: 6,
//   },
//   parkingAddress: {
//     fontSize: 14,
//     color: '#999',
//   },
//   saveButton: {
//     width: 40,
//     height: 40,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   badgesContainer: {
//     flexDirection: 'row',
//     gap: 12,
//   },
//   distanceBadge: {
//     backgroundColor: '#22C55E',
//     paddingHorizontal: 16,
//     paddingVertical: 8,
//     borderRadius: 20,
//   },
//   distanceBadgeText: {
//     color: '#fff',
//     fontSize: 14,
//     fontWeight: '600',
//   },
//   timeBadge: {
//     backgroundColor: '#F3F4F6',
//     paddingHorizontal: 16,
//     paddingVertical: 8,
//     borderRadius: 20,
//   },
//   timeBadgeText: {
//     color: '#333',
//     fontSize: 14,
//     fontWeight: '500',
//   },
//   rulesSection: {
//     paddingHorizontal: 20,
//     paddingVertical: 16,
//   },
//   sectionTitle: {
//     fontSize: 18,
//     fontWeight: '700',
//     color: '#333',
//     marginBottom: 12,
//   },
//   rulesText: {
//     fontSize: 14,
//     color: '#666',
//     lineHeight: 22,
//   },
//   moreLink: {
//     color: '#22C55E',
//     fontWeight: '600',
//   },
//   statsContainer: {
//     flexDirection: 'row',
//     paddingHorizontal: 20,
//     gap: 12,
//     marginTop: 8,
//   },
//   statBox: {
//     flex: 1,
//     backgroundColor: '#D1FAE5',
//     padding: 16,
//     borderRadius: 12,
//     borderLeftWidth: 4,
//     borderLeftColor: '#22C55E',
//   },
//   statValue: {
//     fontSize: 14,
//     fontWeight: '600',
//     color: '#166534',
//   },
//   bookButtonContainer: {
//     padding: 20,
//     paddingBottom: 30,
//   },
//   bookButton: {
//     backgroundColor: '#22C55E',
//     height: 56,
//     borderRadius: 28,
//     justifyContent: 'center',
//     alignItems: 'center',
//     shadowColor: '#22C55E',
//     shadowOffset: {
//       width: 0,
//       height: 4,
//     },
//     shadowOpacity: 0.3,
//     shadowRadius: 8,
//     elevation: 8,
//   },
//   bookButtonText: {
//     color: '#fff',
//     fontSize: 16,
//     fontWeight: '700',
//   },
// });

// export default ParkingDetails;